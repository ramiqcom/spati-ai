export async function GET(){
	const body = await fetch('https://carboncredits.com/wp-admin/admin-ajax.php?action=wp_ajax_ninja_tables_public_action&table_id=1700&target_action=get-all-data&default_sorting=old_first&ninja_table_public_nonce=2078b1fd10');
	const object = await body.text();
	return new Response(object, {
		status: 200
	});
}