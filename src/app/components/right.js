"use client"

// Import packages
import Select from 'react-select';
import { useState } from 'react';
import { Map, Features } from './map';
import shp from 'shpjs';
import { kml } from '@tmcw/togeojson';
import { simplify, area, toWgs84 } from '@turf/turf';
import parseGeoraster from 'georaster';

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

	return (
		<div style={ props.style } className='flexible vertical bigspace'>

			<div>
				Please upload a visualized RGB GeoTIFF image
			</div>

			<input type="file" accept={'.tiff,.tif'} onChange={ (e) => {
				setFile(e.target.files[0]);
				setDisabledShow(false);
			} } />

			<ShowImage image={ file } disabled={ disabledShow } setDisabledCalculate={setDisabledCalculate}/>
		</div>
	)
}

// Show image button
function ShowImage(props){
	const image = props.image;

	return (
		<div>
			<button disabled={ props.disabled } onClick={async () => {
				// Parse GeoTIFF
				const data = await parseGeoraster(image);

				// Load GeoRasterLayer
				let GeoRasterLayer = await import('georaster-layer-for-leaflet');
				GeoRasterLayer = GeoRasterLayer.default;

				// TIFF layer
				const layer = new GeoRasterLayer({
          georaster: data,
          opacity: 1,
          resolution: 256
				}).addTo(Map);
				
				// Zoom to image
				Map.fitBounds(layer.extent.leafletBounds);

				// Set calculate button to enable
				props.setDisabledCalculate(false)
			}}>
				Show image to map
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