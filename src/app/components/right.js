"use client"

// Import packages
import { useState } from 'react';
import { Map, Features } from './map';
import shp from 'shpjs';
import { kml } from '@tmcw/togeojson';
import { area } from '@turf/turf';
import parseGeoraster from 'georaster';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { seagrassAgc } from './seagrass';
import { setSeagrassDisabled, setSeagrassLayer, setImageDisabled, setImageLayer, seagrassLayer, imageLayer, creditData } from './left';
import Table from './table';
import currency from 'currency.js';

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

	// Datatable variable
	const [ area, setArea ] = useState(null);
	const [ nonSeagrass, setNonSeagrass ] = useState(null);
	const [ lowSeagrass, setLowSeagrass ] = useState(null);
	const [ mediumSeagrass, setMediumSeagrass ] = useState(null);
	const [ highSeagrass, setHighSeagrass ] = useState(null);
	const [ lowSeagrassAgc, setLowSeagrassAgc ] = useState(null);
	const [ mediumSeagrassAgc, setMediumSeagrassAgc ] = useState(null);
	const [ highSeagrassAgc, setHighSeagrassAgc ] = useState(null);
	const [ totalAgc, setTotalAgc ] = useState(null);
	const [ carbonCreditUSD, setCarbonCreditUSD ] = useState(null);
	const [ carbonCreditIDR, setCarbonCreditIDR ] = useState(null);
	const dataTable = { area, nonSeagrass, lowSeagrass, mediumSeagrass, highSeagrass, lowSeagrassAgc, mediumSeagrassAgc, highSeagrassAgc, totalAgc, carbonCreditUSD, carbonCreditIDR };
	const dataSet = { setArea, setNonSeagrass, setLowSeagrass, setMediumSeagrass, setHighSeagrass, setLowSeagrassAgc, setMediumSeagrassAgc, setHighSeagrassAgc, setTotalAgc, setCarbonCreditUSD, setCarbonCreditIDR };

	return (
		<div className='right panel flexible vertical padding bigspace'>
			{
				//<AOI setDisabledCalculate={ setDisabledCalculate } />
			}
			<UploadTiff style={{ marginTop: '5%' }} setDisabledClassify={ setDisabledClassify } setDisabledCalculate={ setDisabledCalculate } setFile={ setFile } file={ file } setImage={ setImage } />
			<Classify disabled={ disabledClassify } setDisabledClassify={ setDisabledClassify } image={ image } setDisabledCalculate={ setDisabledCalculate } setDataTensor={ setDataTensor } setBounds={ setBounds } />
			<Calculate disabled={ disabledCalculate } setDisabledCalculate={ setDisabledCalculate } dataSet={ dataSet } dataTensor={ dataTensor } bounds={ bounds } setDisabledDownload={setDisabledDownload} setDownloadLink={setDownloadLink}/>
			<Table disabled={ disabledDownload } dataTable={ dataTable } link={downloadLink} />
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
				const model = await tf.loadLayersModel('model/model_final/Seagrass_1695400109/model.json');

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

// Calculate carbon
function Calculate(props){
	const [ buttonLabel, setButtonLabel ] = useState('Calculate carbon');

	return (
		<div className='flexible vertical spacely' style={ props.style }>
			<button className='greenbutton' disabled={ props.disabled } onClick={ async () => {
				// Disable classify and set loading
				props.setDisabledCalculate(true);
				setButtonLabel('Loading...');
				
				// Tensor
				let tensor = props.dataTensor;
				let shape = tensor.shape;
				const counts = shape.reduce((x, y) => x * y);

				// Data setter
				const { setArea, setNonSeagrass, setLowSeagrass, setMediumSeagrass, setHighSeagrass, setLowSeagrassAgc, setMediumSeagrassAgc, setHighSeagrassAgc, setTotalAgc, setCarbonCreditUSD, setCarbonCreditIDR } = props.dataSet;

				// Calculate area
				const geojson = L.rectangle(props.bounds).toGeoJSON();
				const areaBounds = area(geojson);
				const areaPerElement = Math.round(areaBounds / counts);

				// Calculate area for multiple class
				const properties = [
					{ value: 0, set: setNonSeagrass },
					{ value: 1, set: setLowSeagrass, setAgc: setLowSeagrassAgc },
					{ value: 2, set: setMediumSeagrass, setAgc: setMediumSeagrassAgc },
					{ value: 3, set: setHighSeagrass, setAgc: setHighSeagrassAgc }
				];
				const areaClass = await Promise.all(properties.map(dict => calculateAreaTensor(tensor, dict.value, areaPerElement, dict.set, dict.setAgc )));
				const totalArea = areaClass.map(x => x.area).reduce((x, y) => x + y);
				setArea(totalArea.toLocaleString('id-ID'));

				// Calculate total agc
				const totalAgc = areaClass.map(x => x.agc).reduce((x, y) => x + y);
				setTotalAgc(totalAgc.toLocaleString('id-ID'));

				// Currency data
				const currencyResponse = await fetch('/currency');
				const currencyData = await currencyResponse.text();

				// Carbon data
				const carbonResponse = await fetch('/carbon');
				const carbonData = await carbonResponse.json();
				
				// Carbon price
				const nbs = carbonData.filter(dict => dict.carboncreditscomlivecarbonprices == 'Nature Based Offset')[0].last;
				const number = currency(nbs).value;
				const carbonCreditUSD = totalAgc / 1_000_000 * number;
				const carbonCreditIDR = carbonCreditUSD * currencyData;
				setCarbonCreditUSD(Math.round(carbonCreditUSD).toLocaleString('id-ID'));
				setCarbonCreditIDR(Math.round(carbonCreditIDR).toLocaleString('id-ID'));

				// Set table download link
				const columns = [ 'Variable', 'Value', 'Unit' ];
				const table = [
					[ 'Total AGC', totalAgc, 'gram' ],
					[ 'Carbon credit (NBS)', carbonCreditUSD, 'USD' ],
					[ 'Carbon credit (NBS)', carbonCreditIDR, 'IDR' ],
					[ 'Area', totalArea, 'm^2' ],
					[ 'Non-seagrass', areaClass[0].area, 'm^2' ],
					[ 'Low-density seagrass', areaClass[1].area, 'm^2' ],
					[ 'Medium-density seagrass', areaClass[2].area, 'm^2' ],
					[ 'High-density seagrass', areaClass[3].agc, 'm^2' ],
					[ 'Low-density AGC', areaClass[0].agc, 'gram' ],
					[ 'Medium-density AGC', areaClass[1].agc, 'gram' ],
					[ 'High-density AGC', areaClass[2].agc, 'gram' ],
				];
				props.setDownloadLink(csv(table, columns));

				// Activate download button
				props.setDisabledDownload(false);
				
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
 * Disable many button
 * @param {Function} args
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
async function calculateAreaTensor(tensor, value, areaPerElement, set, setAgc){
	// Calculate area
	let area = await tensor.equal(value).cast('int32').sum().array();
	area = Math.round(area * areaPerElement);
	set(area.toLocaleString('id-ID'));
	
	// Calculate agc
	let agc = seagrassAgc[value];
	agc = Math.round(area * agc);
	setAgc ? setAgc(agc.toLocaleString('id-ID')) : null;

	// Return all object
	return { area, agc };
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