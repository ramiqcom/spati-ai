'use client'

// Important packages
import { Grid } from 'gridjs-react';

// Export table
export default function Table(props){
	// Table property
	const tableProp = {
		style: { container: { fontSize: 'small' } },
		height: '55vh',
		fixedHeader: true,
		resizable: true,
		autoWidth: true
	};

	// Table
	const { area, nonSeagrass, lowSeagrass, mediumSeagrass, highSeagrass, lowSeagrassAgc, mediumSeagrassAgc, highSeagrassAgc, totalAgc, carbonCreditUSD, carbonCreditIDR } = props.dataTable;
	const columns = [ 'Variable', 'Value', 'Unit' ];
	const dataTable = [
		[ 'Total AGC', totalAgc, 'gram' ],
		[ 'Carbon credit (Nature Based Offset)', carbonCreditUSD, 'USD' ],
		[ 'Carbon credit (Nature Based Offset)', carbonCreditIDR, 'IDR' ],
		[ 'Area', area, 'm^2' ],
		[ 'Non-seagrass', nonSeagrass, 'm^2' ],
		[ 'Low-density seagrass', lowSeagrass, 'm^2' ],
		[ 'Medium-density seagrass', mediumSeagrass, 'm^2' ],
		[ 'High-density seagrass', highSeagrass, 'm^2' ],
		[ 'Low-density AGC', lowSeagrassAgc, 'gram' ],
		[ 'Medium-density AGC', mediumSeagrassAgc, 'gram' ],
		[ 'High-density AGC', highSeagrassAgc, 'gram' ],
	];

	return (
		<div className="flexible vertical spacely">
			<Grid 
				{ ...tableProp }
				columns={columns}
				data={dataTable}
			/>

			<a href={props.link} download={'data'}>
				<button disabled={props.disabled}>
					Download data
				</button>		
			</a>
		</div>
	)
}