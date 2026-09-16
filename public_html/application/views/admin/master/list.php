<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  <!-- Content Header (Page header) -->
  <section class="content-header">
    <div class="container-fluid">
      <div class="row mb-2">
        <div class="col-sm-6">
          <h1>{title}</h1>
        </div>
        <div class="col-sm-6">
          <ol class="breadcrumb float-sm-right">
            <li class="breadcrumb-item"><a href="#">Home</a></li>
            <li class="breadcrumb-item">{sub_title}</li>
          </ol>
        </div>
      </div>
    </div><!-- /.container-fluid -->
  </section>

  <!-- Main content -->
  <section class="content">
    <div class="card mb-12">
        <form id="searchForm">
          <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
          <input type="hidden" name="excelType" value="master" >
          
        <div class="card-body">
            <!--begin::Compact form-->
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    가입일
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" id="searchTermTypeAll" name="searchTermType" value=""  <?php echo @$_REQUEST['searchTermType']==''?"checked":"";?>>
                            전체
                        </div>
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchTermTypeDate" name="searchTermType" value="term"  <?php echo @$_REQUEST['searchTermType']!=''?"checked":"";?>>
                            설정
                        </div>                    
                        <input type="date" class="form-control col-2 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="startDate" id="startDate" value="<?php echo @$_REQUEST['startDate'];?>">
                        <span class="float-right mr-1 ml-1 mt-2">~</span>
                        <input type="date" class="form-control col-2 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="endDate" id="endDate" value="<?php echo @$_REQUEST['endDate'];?>">
                </div>
                <!--end::Compact form-->
            </div>
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    계정 상태
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                        <div class="col-sm-1 align-middle col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value=""  <?php echo @$_REQUEST['searchUserStatus']==''?"checked":"";?>>
                            전체
                        </div>
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value="Y" <?php echo @$_REQUEST['searchUserStatus']=='Y'?"checked":"";?>> 
                            정상
                        </div>                    
                        <div class="col-sm-1 col-form-label">
                            <input type="radio" id="searchUserStatus" name="searchUserStatus" value="N" <?php echo @$_REQUEST['searchUserStatus']=='N'?"checked":"";?>>
                            정지
                        </div>                    
                </div>
                <!--end::Compact form-->
            </div>            
 
            <div class="row row-search">
                <div class="col-sm-1" >
                    <div class="col-form-label">
                    검색어
                    </div>
                </div>
                <div class="col-sm-8 row align-middle">
                    <input type="text" class="form-control col-6 float-right date hasDatepicker" style="margin:5px 5px 5px 5px;" name="keyword" id="keyword" value="<?php echo @$_REQUEST['keyword'];?>" placeholder="ID, 이름, 휴대폰번호를 입력해 주세요.">
                    <button type="submit" id="searchBtn" class="btn  btn-primary" >검색</button>
                </div>
                <!--end::Compact form-->
            </div>
        </div>
        </form>
    </div> 
        
    <div class="card mb-12"  style="display:none">
        <div class="form-group row">
            <div>
            <button type="button" id="popup1" data-toggle="modal" data-target="#modal-pop1">팝업1</button>
            </div>
            <div>
            <button type="button" id="popup1"  data-toggle="modal" data-target="#modal-pop2">팝업2</button>
            </div>
            <div>
            <button type="button" id="popup1" data-toggle="modal" data-target="#modal-pop3">팝업3</button>
            </div>
        </div>
    </div> 
                
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <!-- /.card-header -->
            <form id="search_form">
              <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
              <input type="hidden" name="status" id="status" value="" >
              <div class="card-body table-responsive p-0">
                <div class="form-group">
                  <span style="float:left; margin:15px 5px 5px 15px; font-weight:bold">총 {list_total}명</span>
                </div>
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="5%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="15%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>

                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">선택</th>
                        <th class="text-center">번호</th>
                        <th class="text-center">ID</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">휴대폰번호</th>
                        <th class="text-center">가입일</th>
                        <th class="text-center">계정상태</th>
                        <th class="text-center">계정구분</th>
                        <th class="text-center">수정</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr style="cursor:pointer">
                        <td class="text-center align-middle"><input type="checkbox" name="user_seq[]" value="{user_seq}" /></td>
                        <td class="text-center align-middle">{count}</td>
                        
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{user_name}</td>
                        <td class="text-center align-middle">{cell_no}</td>
                        <td class="text-center align-middle">{reg_date}</td>
                        <td class="text-center align-middle">{user_status}</td>
                        <td class="text-center align-middle">{user_type}</td>
                        <td class="text-center align-middle"><button type="button" class="btn btn-block btn-success" onclick="viewDetail('{user_seq}')">수정</button></td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">조회된 마스터가 없습니다.</td>
                      </tr>
                      <?php } ?>
                    </tbody>
                  </table>
              </div>
            </form>
            <!-- /.card-body -->
            <div class="card-footer clearfix">
              <ul class="pagination pagination-sm m-0 float-left">
                {paging}
                {no}
                {/paging}
              </ul>
 
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-warning" onclick="writeBtn()">직접등록</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelWrite()">엑셀 등록</button>
              </span>                                          
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">엑셀 다운로드</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="changeInfo('N')">선택정지</button>
              </span>
              <span class="float-right" style="margin-right:5px;">
                <button type="button" class="btn btn-block btn-success" onclick="changeInfo('Y')">선택승인</button>
              </span>

            </div>
          </div>
          <!-- /.card -->
        </div>
      </div>
      <!-- /.row -->
    </div><!-- /.container-fluid -->
  </section>
  <!-- /.content -->
    <div class="modal fade" id="modal-pop1" style="display: none;" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <!--<h4 class="modal-title">Extra Large Modal</h4>-->
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <tbody>
                            <tr>
                              <th class="bg-">소속명</th>
                              <td >
                                원장
                              </td>
                              <th>대표원장</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>연락처</th>
                              <td >
                                원장
                              </td>
                              <th>주소</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>계정상태</th>
                              <td >
                                원장
                              </td>
                              <th>이용 상품</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>계약일</th>
                              <td >
                                원장
                              </td>
                              <th>만료일</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div class="card card-primary">
                      <div class="mt-10">* 가맹점 등록</div>
                      <div class="card-body">
                          <table class="table table-hover">
                            <colgroup>
                              <col width="10%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                            </colgroup>
                            <thead>
                              <tr>
                                <th class="text-center bg-lightgray">번호</th>
                                <th class="text-center bg-lightgray">이름</th>
                                <th class="text-center bg-lightgray">ID</th>
                                <th class="text-center bg-lightgray">휴대폰번호</th>
                                <th class="text-center bg-lightgray">등록일시</th>
                                <th class="text-center bg-lightgray">상태</th>
                                <th class="text-center bg-lightgray">삭제</th>
                              </tr>
                            </thead>
                          </table>
                        </table>
                      </div>
                  </div>
                  <div class="card card-primary">
                  <!-- Main content -->
                  <section class="content">
                    <div class="container-fluid">
                      <div class="row">
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">가맹점 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$member_total ?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_member_total ?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_leave_member_total ?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                 
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">마스터 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$member_total ?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_member_total ?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_leave_member_total ?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">선생님 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$member_total ?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_member_total ?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_leave_member_total ?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">학생 회원 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$member_total ?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_member_total ?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_leave_member_total ?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->

                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">북퀴즈 등록 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$member_total ?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_member_total ?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_leave_member_total ?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">북퀴즈 인증 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div class="row">
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$member_total ?></h5>
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4 border-right">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_member_total ?></h5>
                                    <span class="description-text">검색회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                                <div class="col-sm-4">
                                  <div class="description-block">
                                    <h5 class="description-header" style="font-size:24px;"><?php echo @$search_leave_member_total ?></h5>
                                    <span class="description-text">탈퇴회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <!-- /.col -->
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->

                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">선호도현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div >
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>                
                              </div>
                              <!-- /.row -->
                            </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->        
                        <!-- 회원현황 -->
                        <div class="col-md-3">
                          <!-- Widget: user widget style 1 -->
                          <div class="card card-widget widget-user">
                            <!-- Add the bg color to the header using any of the bg-* classes -->
                            <div class="widget-user-header bg-info">
                              <h1 class="widget-user-desc mt-3">랭킹 현황</h1>
                            </div>
                            <div class="widget-user-image">
                              <button type="button" class="btn btn-default mt-4" onclick="location.href='/admin/etcAdm/insightMember'">자세히 보기</button>
                            </div>
                            <div class="card-footer pt-4">
                              <div >
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>
                                <div class="col-12 row">
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <div class="col-6">
                                    <span class="description-text">총 회원</span>
                                  </div>
                                  <!-- /.description-block -->
                                </div>                
                              </div>
                          </div>
                          <!-- /.widget-user -->
                        </div>
                        <!-- /.col -->
                      </div>
                      <!-- /.row -->
                    </div><!-- /.container-fluid -->
                  </section>
                  <!-- /.content -->
                </div>
                
                

                  
                <div class="modal-footer justify-content-between">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  
  
    <div class="modal fade" id="modal-pop2" style="display: none;" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <!--<h4 class="modal-title">Extra Large Modal</h4>-->
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="85%" />
                          <tbody>
                            <tr>
                              <th class="bg-">소속명</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>이름</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>ID</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>비밀번호</th>
                              <td >
                                <input type="text">
                                <button type="button">변경</button>
                              </td>
                            </tr>  
                            <tr>
                              <th>휴대폰번호</th>
                              <td >
                                <input type="text">
                                <button type="button">변경</button>
                              </td>
                            </tr>        
                            <tr>
                              <th>상태</th>
                              <td >
                                상태
                              </td>
                            </tr>                                                    
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <tbody>
                            <tr>
                              <th class="bg-">소속학생</th>
                              <td >
                                원장
                              </td>
                              <th class="bg-">반이름</th>
                              <td >
                                원장
                              </td>                              
                            </tr>  
                          </tbody>
                        </table>
                      </div>
                  </div>                  
                  <div class="card card-primary">
                      <div class="card-body">
                          <table class="table table-hover">
                            <colgroup>
                              <col width="25%"/>
                              <col width="25%"/>
                              <col width="25%"/>
                              <col width="25%"/>
                            </colgroup>
                            <thead>
                              <tr>
                                <th class="text-center bg-lightgray">이름</th>
                                <th class="text-center bg-lightgray">ID</th>
                                <th class="text-center bg-lightgray">성별</th>
                                <th class="text-center bg-lightgray">학년</th>
                              </tr>
                            </thead>
                          </table>
                        </table>
                      </div>
                  </div>
                

                  
                <div class="modal-footer justify-content-between">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div>
            </div>
        </div>
      </div>
    </div>
    
    <div class="modal fade" id="modal-pop3" style="display: none;" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <!--<h4 class="modal-title">Extra Large Modal</h4>-->
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div class="modal-body">
                  <div class="card card-primary">
                      <div class="card-body">
                        <table class="table table-bordered">
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <colgroup width="15%" />
                          <colgroup width="35%" />
                          <tbody>
                            <tr>
                              <th class="bg-">소속명</th>
                              <td >
                                원장
                              </td>
                              <th>대표원장</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>연락처</th>
                              <td >
                                원장
                              </td>
                              <th>주소</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>계정상태</th>
                              <td >
                                원장
                              </td>
                              <th>이용 상품</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                            <tr>
                              <th>계약일</th>
                              <td >
                                원장
                              </td>
                              <th>만료일</th>
                              <td >
                                원장
                              </td>
                            </tr>  
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div class="card card-primary">
                      <div class="mt-10">* 원생 등록 내역</div>
                      <div class="card-body">
                          <table class="table table-hover">
                            <colgroup>
                              <col width="10%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                              <col width="12%"/>
                            </colgroup>
                            <thead>
                              <tr>
                                <th class="text-center bg-lightgray">번호</th>
                                <th class="text-center bg-lightgray">이름</th>
                                <th class="text-center bg-lightgray">ID</th>
                                <th class="text-center bg-lightgray">휴대폰번호</th>
                                <th class="text-center bg-lightgray">등록일시</th>
                                <th class="text-center bg-lightgray">상태</th>
                                <th class="text-center bg-lightgray">삭제</th>
                              </tr>
                            </thead>
                          </table>
                        </table>
                      </div>
                  </div>
 
                

                  
                <div class="modal-footer justify-content-between">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div>
            </div>
        </div>
      </div>
    </div>      
</div>
<!-- /.content-wrapper -->
<script>
    
  function excelDownload()
  {
      $('#searchForm').attr("action","/admin/partner/userDownload");
      $('#searchForm').submit();
      
      $('#searchForm').attr("action","");
    
  }    
  function viewDetail($seq)
  {
      location.href="write/"+$seq;
  }

  function writeBtn()
  {
    location.href="write";
  }

  function excelWrite()
  {
    window.open("/admin/master/masterExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
  
function allCheckClick()
{
    if($('#allCheck').is(":checked") == true ){
        $('input[name="user_seq[]"]').prop("checked",true);
    }else{
        $('input[name="user_seq[]"]').prop("checked",false);
    }
}

function changeInfo(status)
{
    var chkBool = false;
    $('input[name="user_seq[]"]').each(function(){
        if($(this).is(":checked")){
          chkBool = true;
          return;
        }
    });
    
    
    if(chkBool == false){
        alert("변경할 정보를 선택해 주세요.");
        return;
    }
    
    var csrf_name = $('#csrf').attr("name");
    var csrf_val = $('#csrf').val();
    $('#status').val(status);
    
    var data = $('#search_form').serialize();
    
    data[csrf_name] = csrf_val;
    
    $.ajax({
        type: "POST",
        url : "/admin/partner/updateUserStatus",
        data: data,
        dataType:"json",
        success : function(data, status, xhr) {
            alert("상태가 변경되었습니다.");
            location.reload();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR.responseText);
        }
    });
}    
</script>
