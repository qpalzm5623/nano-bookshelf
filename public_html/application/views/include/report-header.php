<!DOCTYPE html>
<html lang="kr">
<head>
    <meta charset="utf-8">
    <meta http-equiv="content-type" content="text/html; charset=UTF-8 ">
    <title>Report</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Font Awesome -->
    <script src="{base_url}assets/admin_resources/plugins/jquery/jquery.min.js"></script>
  
    <link rel="stylesheet" href="/resources/css/normalize.css">
    <link rel="stylesheet" href="/resources/css/common.css">
    <link rel="stylesheet" href="/resources/css/sub.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script>
    <script src="/resources/js/common.js"></script>  
	<style>
	    .text-right {text-align:right;}
        .bookquiz_portfolio .title_box {
            justify-content: start;
            gap: 7px;
            width: 100%;
            position: inherit;
            text-align: right;
        }
        .span {float:right;font-weight:bold;color:#000;}
        #.hide {display:none;}
	</style>    
</head>
<body>
	<div id="wrap">
		<!-- header -->
		<header class="sub_header">
			<div class="inner">
				<h2 class="header_title">나노의 책장</h2>
			</div>
		</header>

		<!-- contents -->
		<div id="contents" class="contents">
		    <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>