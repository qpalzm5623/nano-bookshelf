<footer class="main-footer">
  <strong>Copyright &copy; 2024 <a href="/admin">Admin</a>.</strong>
  All rights reserved.
</footer>

<!-- Control Sidebar -->
<aside class="control-sidebar control-sidebar-dark">
  <!-- Control sidebar content goes here -->
</aside>
<!-- /.control-sidebar -->
</div>
<!-- ./wrapper -->
<script>
    $(document).on("keyup", "#cell_no", function() { 
        $(this).val( $(this).val().replace(/[^0-9]/g, "").replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-") ); 
    });
    
    
    function isEmail(asValue) {
        var regExp = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
        return regExp.test(asValue); // 형식에 맞는 경우 true 리턴
    }

    //휴대폰 전화 체크 정규식


    function isCelluar(asValue) {
        var regExp = /^01(?:0|1|[6-9])-(?:\d{3}|\d{4})-\d{4}$/;
        return regExp.test(asValue); // 형식에 맞는 경우 true 리턴
    }      
    $( function() {
        var dateFormat = "yy-mm-dd",
          from = $( "#service_start_date" )
            .datepicker({
              defaultDate: "+1w",
              changeMonth: true, 
              numberOfMonths: 3
            })
            .on( "change", function() {
              to.datepicker( "option", "minDate", getDate( this ) );
            }),
          to = $( "#service_end_date" ).datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 3
          })
          .on( "change", function() {
            from.datepicker( "option", "maxDate", getDate( this ) );
          });
          
          sfrom = $( "#start_date" )
            .datepicker({
              defaultDate: "+1w",
              changeMonth: true,
              numberOfMonths: 3
            })
            .on( "change", function() {
              sto.datepicker( "option", "minDate", getDate( this ) );
            }),
          sto = $( "#end_date" ).datepicker({
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 3
          })
          .on( "change", function() {
            sfrom.datepicker( "option", "maxDate", getDate( this ) );
          });          
        
        function getDate( element ) {
          var date;
          try {
            date = $.datepicker.parseDate( dateFormat, element.value );
          } catch( error ) {
            date = null;
          }
        
          return date;
        }
    });    
    
document.getElementById('user_id').addEventListener('input', function (e) {
    var inputElement = e.target;
    var validPattern = /^[a-zA-Z0-9]*$/; // 알파벳 대소문자와 숫자만 허용

    if (!validPattern.test(inputElement.value)) {
        inputElement.value = inputElement.value.replace(/[^a-zA-Z0-9]/g, '');
    }
});    
</script>
 
