'use client'

// Import packages
import initMap from './map';
import Script from 'next/script';

// Canvas
export default function Canvas(){
	return (
		<div className='canvas'>
			<Map />
			
			<Script 
				src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"
				integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM="
				crossOrigin=""
				onLoad={() => {
					// Initiate application state
					initMap('map');
				}}
			/>

		</div>
	)
}

// Map
function Map () {
	return (
		<div id='map'>

		</div>
	)
};

