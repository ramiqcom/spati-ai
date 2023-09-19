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

// Main geojson
// let geojson = null;
// export let setGeojson;

// Calculate button
let disabledCalculate;
export let setDisabledCalculate;

// Right
export default function Right(){
	[ disabledCalculate, setDisabledCalculate ] = useState(true);
	// [ geojson, setGeojson ] = useState(null);

	return (
		<div className='right panel flexible vertical padding bigspace'>
			{
				//<AOI setDisabledCalculate={ setDisabledCalculate } />
			}
			<UploadTiff style={{ marginTop: '5%' }} setDisabledCalculate={setDisabledCalculate}/>
			<Calculate disabled={ disabledCalculate } />
		</div>
	)
}

// Upload GeoTIFF
function UploadTiff(props){
	const [ file, setFile ] = useState(null);
	const [ disabledShow, setDisabledShow ] = useState(true);
	const [ disabledClassify, setDisabledClassify ] = useState(true);
	const [ image, setImage ] = useState(null);

	return (
		<div style={ props.style } className='flexible vertical bigspace'>

			<div>
				Please upload a visualized RGB GeoTIFF image
			</div>

			<input type="file" accept={'.tiff,.tif'} onChange={ (e) => {
				setFile(e.target.files[0]);
				setDisabledShow(false);
			} } />

			<ShowImage file={ file } disabled={ disabledShow } setDisabledClassify={ setDisabledClassify } setImage={setImage} />
			<Classify disabled={ disabledClassify } image={image} />
		</div>
	)
}

// Show image button
function ShowImage(props){
	return (
		<div>
			<button disabled={ props.disabled } onClick={async () => {
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
			}}>
				Show image to map
			</button>
		</div>
	)
}

// Button to classify image
function Classify(props){
	return (
		<div>
			<button disabled={ props.disabled } onClick={async () => {
				// Get image information
				const image = props.image;
				const { noDataValue, pixelHeight, pixelWidth, projection, xmin, xmax, ymax, ymin, values } = await image;
				console.log(image);

				// Set process to webgpu
				await tf.setBackend('webgpu');
				
				// Preprocess tensor for prediction
				let tensor = tf.tensor(values).transpose();
				const shape = tensor.shape;
				tensor = tensor.reshape([1, shape[0], shape[1], shape[2]]);	

				// Load model
				const model = await tf.loadLayersModel('model/model_final/Seagrass_UNET_1695018449/model.json');

				// Predict!
				let prediction = model.predict(tensor);
				prediction = tf.argMax(prediction, 3);
				const predictShape = prediction.shape;
				prediction = prediction.reshape([predictShape[1], predictShape[2]]);
				prediction = await prediction.array();

				// Create an image
				const seagrass = await parseGeoraster([prediction], { noDataValue, pixelHeight, pixelWidth, projection, xmin, xmax, ymax, ymin });

				// Load GeoRasterLayer
				let GeoRasterLayer = await import('georaster-layer-for-leaflet');
				GeoRasterLayer = GeoRasterLayer.default;

				// TIFF layer
				const seagrassPalette = [ 'lightskyblue', 'lightgreen', 'limegreen', 'darkgreen' ]
				const layer = new GeoRasterLayer({
          georaster: seagrass,
          opacity: 1,
          resolution: 1024,
					pixelValuesToColorFn: value => seagrassPalette[value]
				}).addTo(Map);
				
				// Zoom to image
				Map.fitBounds(layer.extent.leafletBounds);
			}}>
				Classify Image
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
	return (
		<div className='flexible vertical spacely' style={props.style}>
			<button className='greenbutton' disabled={props.disabled} onClick={ async () => {
			}}>
				Calculate
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