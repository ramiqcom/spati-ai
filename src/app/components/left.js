'use client'

// Import packages
import { useState } from "react";
import { seagrassPalette, seagrassLabel, seagrassAgc } from "./seagrass";
import Image from 'next/image';
import logo from '../../../public/logo.png';
import { Grid } from 'gridjs-react';
import { html } from 'gridjs';

// State disable check seagrass layer
let imageDisabled;
export let setImageDisabled;

// State seagrass layer
export let imageLayer;
export let setImageLayer;

// State disable check seagrass layer
let seagrassDisabled;
export let setSeagrassDisabled;

// State seagrass layer
export let seagrassLayer;
export let setSeagrassLayer;

// Left panel
export default function Left(){
	return (
		<div className='left panel flexible vertical padding smallspace'>

			<div className="flexible padding smallspace center2" style={{ marginTop: '5%' }}>
				<Image 
					src={logo}
					alt="SPATI.AI" 
					height={50} 
				/>
			</div>

			<ImageLayer />
			<Seagrass />
			<AGCInfo />
			<CarbonCredit />
		</div>
	)
}

// Image ayer
function ImageLayer(){
	const [ check, setCheck ] = useState(true);
	[ imageDisabled, setImageDisabled ] = useState(true);
	[ imageLayer, setImageLayer ] = useState(null); 

	return (
		<div className="flexible layer horizontal smallspace blue" style={{ color: 'white' }}>
			<input type="checkbox" checked={check} disabled={imageDisabled} onChange={e => {
					const status = e.target.checked;
					setCheck(status);
					status ? imageLayer.setOpacity(1) : imageLayer.setOpacity(0);
				}}/>Image
		</div>
	)
}

// Seagrass data
function Seagrass(){
	const [ check, setCheck ] = useState(true);
	[ seagrassDisabled, setSeagrassDisabled ] = useState(true);
	[ seagrassLayer, setSeagrassLayer ] = useState(null); 

	return (
		<div className="flexible layer vertical smallspace blue">
			<div style={{ color: 'white' }}>
				<input type="checkbox" checked={check} disabled={seagrassDisabled} onChange={e => {
					const status = e.target.checked;
					setCheck(status);
					status ? seagrassLayer.setOpacity(1) : seagrassLayer.setOpacity(0);
				}}/>Seagrass percent cover
			</div>

			<SeagrassLegend />
		</div>
	)
}

// Seagrass legend
function SeagrassLegend(){
	return (
		<div className="flexible legend vertical smallspace">
			{ seagrassPalette.map((palette, index) => {
				return (
					<div className="flexible horizontal smallspace" key={index}>
						<div style={{ backgroundColor: palette, flex: 1, height: '1.5vh', border: '0.5px solid white' }} /> 
						<div style={{ flex: 5, fontSize: '12px' }}> { seagrassLabel[index] } </div>
					</div>
				);
			}) }
		</div>
	);
}

// AGC based on percent cover
function AGCInfo(){
	return (
		<div className="flexible layer vertical smallspace blue" style={{ color: 'white' }}>
			Seagrass AGC (Above Ground Carbon Stock)
			{ seagrassLabel.map((label, index) => {
				return (
					<div className="flexible horizontal smallspace" key={index}>
						<div style={{ flex: 5, fontSize: '12px' }}> { `${label}: ` } </div>
						<div style={{ flex: 1, fontSize: '12px' }}> { seagrassAgc[index] } </div>
						<div style={{ flex: 1, fontSize: '12px' }}> { 'gram/\u33A1' } </div>
					</div>
				);
			}) }
			<a href="https://isprs-archives.copernicus.org/articles/XLVI-4-W6-2021/321/2021/" target="_blank" style={{ color: 'white' }}>
				Source
			</a>
		</div>
	);
}

// Carbon credit
function CarbonCredit(){
	const tableProp = {
		style: { container: { fontSize: 'small' } },
		height: '30vh',
		fixedHeader: true,
		resizable: true,
		autoWidth: true
	};
	const columns = [
		{ name: html(
      "<a href='https://carboncredits.com/carbon-prices-today/' target='_blank' style={{ textJustify: 'center' }}> Market </a>"
    ), id: 'carboncreditscomlivecarbonprices' }, 
		{ name: 'Last (per Ton)', id: 'last' }, 
		{ name: 'Change', id: 'change' }, 
		{ name: 'YTD', id: 'ytd' }
	];

	return (
		<div className="flexible layer vertical smallspace">
			<Grid
				{ ...tableProp }
				columns={columns}
				data={ async () => {
					const response = await fetch('/carbon');
					const json = await response.json();
					return json;
				}}
			/>
		</div>
	)
}