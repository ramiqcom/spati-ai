// Important packages
import { Grid } from 'gridjs-react';

// Export table
export default function Table(props){
	// Table property
	const tableProp = {
		style: { container: { fontSize: 'small' } },
		height: '45vh',
		fixedHeader: true,
		resizable: true,
		autoWidth: true
	}	

	// Table
	const data = props.dataTable;
	const columns = [ 'Variable', 'Value', 'Unit' ];
	const dataTable = [
		[ 'Area', data.area, '\u33A1' ],
		[ 'Non-seagrass', data.nonSeagrass, '\u33A1' ],
		[ 'Low-density seagrass', data.lowSeagrass, '\u33A1' ],
		[ 'Medium-density seagrass', data.mediumSeagrass, '\u33A1' ],
		[ 'High-density seagrass', data.highSeagrass, '\u33A1' ],
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