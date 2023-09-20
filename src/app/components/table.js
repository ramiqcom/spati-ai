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
		[ 'Area', data.area, 'Ha' ],
		[ 'Non-seagrass', data.nonSeagrass, 'Ha' ],
		[ 'Low-density seagrass', data.lowSeagrass, 'Ha' ],
		[ 'Medium-density seagrass', data.mediumSeagrass, 'Ha' ],
		[ 'High-density seagrass', data.highSeagrass, 'Ha' ],
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