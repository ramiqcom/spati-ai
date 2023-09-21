"use client"

// Import packages
import Select from 'react-select';
import { useState } from 'react';
import { Map, Features } from './map';
import shp from 'shpjs';
import { kml } from '@tmcw/togeojson';
import { simplify, area, toWgs84 } from '@turf/turf';
import parseGeoraster from 'georaster';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { setSeagrassDisabled, setSeagrassLayer, setImageDisabled, setImageLayer, seagrassLayer, imageLayer } from './left';
import Table from './table';

// Main geojson
// let geojson = null;
// export let setGeojson;

// Right
export default function Right(){
	const [ file, setFile ] = useState(null);
	const [ image, setImage ] = useState(null);
	const [ bounds, setBounds ] = useState(null);
	const [ dataTensor, setDataTensor ] = useState(null);
	const [ disabledClassify, setDisabledClassify ] = useState(true);
	const [ disabledCalculate, setDisabledCalculate ] = useState(true);
	const [ disabledDownload, setDisabledDownload ] = useState(true);
	const [ downloadLink, setDownloadLink ] = useState(null);
	// [ geojson, setGeojson ] = useState(null);

	// Datatable variable
	const [ area, setArea ] = useState(null);
	const [ nonSeagrass, setNonSeagrass ] = useState(null);
	const [ lowSeagrass, setLowSeagrass ] = useState(null);
	const [ mediumSeagrass, setMediumSeagrass ] = useState(null);
	const [ highSeagrass, setHighSeagrass ] = useState(null);
	const dataTable = { area, nonSeagrass, lowSeagrass, mediumSeagrass, highSeagrass };
	const dataSet = { setArea, setNonSeagrass, setLowSeagrass, setMediumSeagrass, setHighSeagrass };

	return (
		<div className='right panel flexible vertical padding bigspace'>
			{
				//<AOI setDisabledCalculate={ setDisabledCalculate } />
			}
			<UploadTiff style={{ marginTop: '5%' }} setDisabledClassify={ setDisabledClassify } setDisabledCalculate={ setDisabledCalculate } setFile={ setFile } file={ file } setImage={ setImage } />
			<Classify disabled={ disabledClassify } setDisabledClassify={ setDisabledClassify } image={ image } setDisabledCalculate={ setDisabledCalculate } setDataTensor={ setDataTensor } setBounds={ setBounds } />
			<Calculate disabled={ disabledCalculate } setDisabledCalculate={ setDisabledCalculate } dataSet={ dataSet } dataTensor={ dataTensor } image={ image } bounds={ bounds } />
			<Table disabled={ disabledDownload } link={ downloadLink } dataTable={ dataTable } />
		</div>
	)
}

// Upload GeoTIFF
function UploadTiff(props){
	const [ disabledShow, setDisabledShow ] = useState(true);

	return (
		<div style={ props.style } className='flexible vertical bigspace'>

			<div>
				Please upload a visualized RGB GeoTIFF image
			</div>

			<input type="file" accept={'.tiff,.tif'} onChange={ (e) => {
				props.setFile(e.target.files[0]);
				setDisabledShow(false);
			} } />

			<ShowImage 
				file={ props.file }
				disabled={ disabledShow } 
				setDisabledClassify={ props.setDisabledClassify }
				setDisabledCalculate={ props.setDisabledCalculate }
				setImage={ props.setImage }
				setDisabledShow={ setDisabledShow }
			/>

		</div>
	)
}

// Show image button
function ShowImage(props){
	const [ buttonLabel, setButtonLabel ] = useState('Show image to map');
	return (
		<div>
			<button disabled={ props.disabled } onClick={async () => {
				// Disable this button and set loading
				props.setDisabledShow(true);
				setButtonLabel('Loading...');

				// Disable button
				disableButton(props.setDisabledCalculate, props.setDisabledClassify);

				// Parse GeoTIFF
				const data = await parseGeoraster(props.file);
				props.setImage(data);

				// Load GeoRasterLayer
				let GeoRasterLayer = await import('georaster-layer-for-leaflet');
				GeoRasterLayer = GeoRasterLayer.default;

				// TIFF layer
				const layer = new GeoRasterLayer({
          georaster: data,
          opacity: 1,
          resolution: 1024
				}).addTo(Map);
				
				// Zoom to image
				Map.fitBounds(layer.extent.leafletBounds);

				// Enable classify button
				props.setDisabledClassify(false);

				// Set image layer panel
				setImageDisabled(false)

				// Set image layer bind
				setImageLayer(layer);

				// Enable this button and set loading to false
				props.setDisabledShow(false);
				setButtonLabel('Show image to map');
			}}>
				{ buttonLabel }
			</button>
		</div>
	)
}

// Button to classify image
function Classify(props){
	const [ buttonLabel, setButtonLabel ] = useState('Classify image');

	return (
		<div>
			<button disabled={ props.disabled } onClick={async () => {
				// Disable classify and set loading
				props.setDisabledClassify(true);
				setButtonLabel('Loading...');

				// Get image information
				const image = props.image;
				const { noDataValue, pixelHeight, pixelWidth, projection, xmin, xmax, ymax, ymin, values } = await image;

				// Set process to webgpu
				await tf.setBackend('webgpu');
				
				// Preprocess tensor for prediction
				let tensor = tf.tensor(values).div(255).transpose();
				const shape = tensor.shape;
				tensor = tensor.reshape([1, shape[0], shape[1], shape[2]]);

				// Load model
				const model = await tf.loadLayersModel('model/model_final/Seagrass_1695248109/model.json');

				// Predict!
				let prediction = model.predict(tensor); // Predict the image
				prediction = tf.argMax(prediction, 3) // Get the highest value
				const predictionShape = prediction.shape // Prediction array reshaping
				prediction = prediction.reshape([predictionShape[1], predictionShape[2]]) // Reshape the image
				prediction = prediction.reverse(1).transpose().reverse(0); // Correcting the image orientation
				props.setDataTensor(prediction); // Set data tensor for further calculation
				prediction = await prediction.array(); // Get the array from the tensor

				// Create an image
				const seagrass = await parseGeoraster([prediction], { noDataValue, pixelHeight, pixelWidth, projection, xmin, xmax, ymax, ymin });

				// TIFF layer
				const seagrassPalette = [ 'lightskyblue', 'lightgreen', 'limegreen', 'darkgreen' ]
				const layer = new GeoRasterLayer({
          georaster: seagrass,
          opacity: 1,
          resolution: 1024,
					pixelValuesToColorFn: value => seagrassPalette[value]
				}).addTo(Map);
				
				// Zoom to image
				const bounds = layer.extent.leafletBounds
				Map.fitBounds(bounds);
				props.setBounds(bounds);

				// Enabled seagrass layer
				setSeagrassDisabled(false);

				// Set seagrass layer bind
				setSeagrassLayer(layer);

				// Set calculate button to enable
				props.setDisabledCalculate(false);

				// Enable classify and set loading to false
				props.setDisabledClassify(false);
				setButtonLabel('Classify image');
			}}>
				{ buttonLabel }
			</button>
		</div>
	)
}

/*
// AOI section 
function AOI(props){
	// AOI state
	const [ aoiOption, setAoiOption ] = useState({ label: 'Draw AOI', value: 'draw' });

	// Upload state
	const [ uploadVis, setUploadVis ] = useState('hidden');

	// Data format
	const [ format, setFormat ] = useState('');

	// AOI options
  const aoiOptions = [
    { label: 'Draw AOI', value: 'draw' },
    { label: 'Shapefile (zip)', value: 'shp' },
    { label: 'KML', value: 'kml' },
    { label: 'GeoJSON', value: 'geojson' }
  ];

	// AOI format
	const formats = {
		shp: '.zip',
		geojson: '.geojson,.json',
		kml: '.kml,.kmz'
	};

	return (
		<div className='flexible vertical spacely' style={{ marginTop: '5%' }}>
			Select an AOI option

			<div>
				<Select
					options={ aoiOptions }
					defaultValue={ aoiOption }
					onChange={ (option) => {
						setAoiOption(option);
						clear(props.setDisabledCalculate);

						if (option.value == 'draw'){
							setUploadVis('hidden');
							Map.pm.controlsVisible() ? null : Map.pm.toggleControls();
						} else {
							Map.pm.controlsVisible() ? Map.pm.toggleControls() : null;
							setUploadVis('visible');
							setFormat(formats[option.value]);
						};
					} }
				/>
			</div>

			<Upload style={{ visibility: uploadVis }} format={ format } option={ aoiOption.value } setDisabledCalculate={ props.setDisabledCalculate } />

			<button className='greenbutton' onClick={() => {
				Features.clearLayers();
				props.setDisabledCalculate(true);
			}}>
				Remove AOI
			</button>
		</div>
	)
}

// Upload section
function Upload(props){
	const [ file, setFile ] = useState(null);
	const [ disabledShow, setDisabledShow ] = useState(true);

	return (
		<div style={ props.style } className='flexible vertical spacely'>
			<input type="file" accept={ props.format } onChange={ (e) => {
				setFile(e.target.files[0]);
				setDisabledShow(false);
			} } />

			{
				//<ShowGeometry disabled={ disabledShow } file={ file } format={ props.option } setDisabledCalculate={ props.setDisabledCalculate } />
			}

		</div>
	)
}
*/

/*
// Button to show the uploaded geometry to map
function ShowGeometry(props){
	const converterFunction = {
		shp: shpJson,
		geojson: geojsonParse,
		kml: kmlJson
	};

	return (
		<div>
			<button className='greenbutton' disabled={props.disabled} onClick={ async () => {
				// Clear main features data
				clear(props.setDisabledCalculate);
				
				// Convert any data to geojson
				geojson = await converterFunction[props.format](props.file);

				// Convert any projection to wgs84
				geojson = area(geojson) < 0 ? toWgs84(geojson) : geojson;

				// Simplify geometries and delete unecessary data
				await geojson.features.map(x => x.properties = null);
				geojson = await simplify(geojson, { tolerance: 0.001, mutate: true });
			
				// Set geojson as leaflet layers
				const leafletGeojson = L.geoJSON(geojson);

				// Add leaflet layers to the main Features
				Features.addLayer(leafletGeojson);

				// Get the center of geojson
				const center = leafletGeojson.getBounds();
				
				// Move maps to geojson location
				Map.fitBounds(center);

				// Turn on calculate button
				props.setDisabledCalculate(false);
			}}>
				Show Uploaded AOI
			</button>
		</div>
	)
}
*/

// Calculate carbon
function Calculate(props){
	const [ buttonLabel, setButtonLabel ] = useState('Calculate carbon');

	return (
		<div className='flexible vertical spacely' style={ props.style }>
			<button className='greenbutton' disabled={ props.disabled } onClick={ async () => {
				// Disable classify and set loading
				props.setDisabledCalculate(true);
				setButtonLabel('Loading...');

				// Image
				const image = props.image;
				
				// Tensor
				let tensor = props.dataTensor;
				let shape = tensor.shape;
				const counts = shape.reduce((x, y) => x * y);

				// Data setter
				const { setArea, setNonSeagrass, setLowSeagrass, setMediumSeagrass, setHighSeagrass } = props.dataSet;

				// Calculate area
				const geojson = L.rectangle(props.bounds).toGeoJSON();
				const areaBounds = area(geojson);
				const areaPerElement = Math.round(areaBounds / counts);

				// Calculate area for multiple class
				const properties = [
					{ value: 0, set: setNonSeagrass },
					{ value: 1, set: setLowSeagrass },
					{ value: 2, set: setMediumSeagrass },
					{ value: 3, set: setHighSeagrass },
				];
				const areaClass = await Promise.all(properties.map(dict => calculateAreaTensor(tensor, dict.value, areaPerElement, dict.set)));
				const totalArea = areaClass.reduce((x, y) => x + y);
				setArea(totalArea);

				// Enable classify and set loading false
				props.setDisabledCalculate(false);
				setButtonLabel('Calculate carbon');
			}}>
				{ buttonLabel }
			</button>
		</div>
	)
}

/**
 * Convert SHP to GeoJSON
 * @param {Blob} file - ArrayBuffer
 * @returns {GeoJSON} - GeoJSON
 */
async function shpJson(file){
  return shp(await file.arrayBuffer());
}

/**
 * Convert KML to GeoJSON
 * @param {Blob} file - ArrayBuffer
 * @returns {GeoJSON} - GeoJSON
 */
async function kmlJson(file){
  const text = await file.text();
  const parsed = new DOMParser().parseFromString(text, 'application/xml');
  return kml(parsed);
}

/**
 * Parse GeoJSON
 * @param {Blob} file - ArrayBuffer
 * @returns {GeoJSON} - GeoJSON
 */
async function geojsonParse(file){
  const text = await file.text();
  return JSON.parse(text);
}

// Function to clear data
function clear(setDisabledCalculate){
	// setGeojson(null);
	Features.clearLayers();
	setDisabledCalculate(true);
}

/**
 * Function to make array to csv url
 * @param {Array.<Array.<String|Number>>} data - Arrays of array that compose a table 
 * @param {Array.<String>} columns - Column of the table
 * @returns {String} - URI of the CSV
 */
function csv(data, columns){
	const array = Array.from(data);
	array.unshift(columns);
	const string = data.map(row => row.join(',')).join('\n');
	const url =  encodeURI('data:text/csv;charset=utf-8,' + string);
	return url;
}

/**
 * Disable many button
 */
function disableButton(...args){
	// Nonactive feature
	args.map(fun => fun(true));

	// Set layer binding to disabled
	setSeagrassDisabled(true);
	setSeagrassLayer(null);
	setImageDisabled(true);
	setImageLayer(null);

	// Remove layer if change image
	seagrassLayer ? Map.removeLayer(seagrassLayer) : null;
	imageLayer ? Map.removeLayer(imageLayer) : null; 
}

/**
 * Function to calculate area using tensor
 * @param {tf.Tensor1D} tensor
 * @param {Number} areaPerElement
 * @param {Function} set
 */
async function calculateAreaTensor(tensor, value, areaPerElement, set){
	let data = await tensor.equal(value).cast('int32').sum().array();
	data = Math.round(data * areaPerElement / 10000);
	set(data);
	return data
}