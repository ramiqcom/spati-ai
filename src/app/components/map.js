'use client'

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

// Map state
export let Map;
export let Features;

// ** Global Variables ** //

export default async function initMap(id){
	// Set tf process to webgpu
	await tf.setBackend('webgpu');

	// Load GeoRasterLayer
	const GeoRasterLayer = (await import('georaster-layer-for-leaflet')).default;

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
}