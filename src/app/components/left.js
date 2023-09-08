'use client'

// Import packages
import { useState } from "react";
import { seagrassPalette, seagrassLabel } from "./seagrass";

// Left panel
export default function Left(){
	return (
		<div className='left panel flexible vertical padding smallspace'>
			<Seagrass />
		</div>
	)
}

// Seagrass data
function Seagrass(){
	const [ check, setCheck ] = useState(true);

	return (
		<div className="flexible layer vertical smallspace">
			<div style={{ color: 'white' }}>
				<input type="checkbox" checked={check} onChange={e => {
					setCheck(e.target.checked);
				}}/>Seagrass
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