'use client'

// Import geojson
import { /*setGeojson,*/ setDisabledCalculate } from './right';

// Map state
export let Map;
export let Features;

// ** Global Variables ** //

export default async function initMap(id){
	// Added additional packages
	// require('@geoman-io/leaflet-geoman-free');

	// Assign map
	Map = L.map(id, 
		{ 
			center: { lat: -0.9729866, lng: 116.7088379 } ,
			zoom: 5,
		}
	);
	
		// Google Maps
	L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
		attribution: 'Google Maps'
	}).addTo(Map);

	// Features
	// Features = L.geoJSON([]).addTo(Map);

	/*
	// Add drawing control
	Map.pm.addControls({
		drawCircleMarker: false,
		drawPolyline: false,
		drawMarker: false,
		drawText: false
	});

	// Add created geometry to layer group
	Map.on('pm:create', e => {
		Features.addLayer(e.layer);
		//setGeojson(Features.toGeoJSON());
		setDisabledCalculate(false);
	});
	*/
}