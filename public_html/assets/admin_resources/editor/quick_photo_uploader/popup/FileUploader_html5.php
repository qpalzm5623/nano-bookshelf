<?php
 	$sFileInfo = '';
	$headers = array();
	foreach ($_SERVER as $k => $v){

		if(substr($k, 0, 9) == "HTTP_FILE"){
			$k = substr(strtolower($k), 5);
			$headers[$k] = $v;
		}
	}

	$file = new stdClass;
	$file->name = rawurldecode($headers['file_name']);
	$file->size = $headers['file_size'];
	$file->content = file_get_contents("php://input");

  //$ran_name = strtotime(date('Y-m-d H:i:s'));
  $f_path = pathinfo($file->name);
  $end_name = strtolower($f_path['extension']);
  $uni = uniqid('_editor_').".".$end_name;


	//$newPath = $_SERVER['DOCUMENT_ROOT'].'/adm_resources/editor/upload_img/--'.$ran_name.iconv("utf-8", "cp949", $file->name);
  $newPath = $_SERVER['DOCUMENT_ROOT'].'/assets/admin_resources/editor/upload_img/'.$uni;
	if(file_put_contents($newPath, $file->content)) {
		$sFileInfo .= "&bNewLine=true";
		$sFileInfo .= "&sFileName=".$file->name;
		$sFileInfo .= "&sFileURL=/assets/admin_resources/editor/upload_img/".$uni;
	}
	echo $sFileInfo;
 ?>
