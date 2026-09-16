<!DOCTYPE html>
<html lang="kor" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>서약서 프린트</title>
    <style type="text/css">
    @page {
      size: A4; // 프린트 사이즈
      margin: 0; // 프린트 여백
    }


    @media print, screen {
      * {
          margin: 0;
          padding: 0.5mm;
          box-sizing: border-box;
          -moz-box-sizing: border-box;
          print-color-adjust: exact; // 크롬 배경화면 프린트
      }
      html, body {

        width: 210mm;

        height: 296mm;

        }

      .print-wrap {
        margin: 0;
        width: 21cm;
        height: 29.6cm;

        border: initial;

        width: initial;

        min-height: initial;

        box-shadow: initial;

        background: initial;

        page-break-after: always;
      }

      .print-wrap .prd-list-tr {
    	page-break-inside: avoid; // 해당 엘리먼트의 내부에서 페이지 넘김을 금지
      }

      .print_name {
        position: absolute;
        width:100%;
        top:293px;
        text-align: right;
        padding-right: 120px;
        font-size:xx-large;
        font-weight:bold;
        font-family: serif;
      }

      .print_date {
        position: absolute;
        width:100%;
        top:800px;
        text-align: center;
        font-size:xx-large;
        font-weight:bold;
        font-family: serif;
      }

    }
    </style>
  </head>
  <body onload="window.print();">
    <div class="print-wrap">
      <div class="print_name"><?php echo $oauthData['user_name']; ?></div>
      <div class="print_date"><?php echo date("Y-m-d",strtotime($oauthData['oauth_reg_date'])); ?></div>
      <img src="/images/util/oauth_img.png" width="100%" height="100%">
    </div>
  </body>
</html>
