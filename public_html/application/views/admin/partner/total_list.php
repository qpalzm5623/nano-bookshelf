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
    <div class="card mb-12" style="display:none">
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
            <form id="searchForm">
              <div class="card-body table-responsive p-0">
                <input type="hidden" id="csrf" name="<?=$this->security->get_csrf_token_name();?>" value="<?=$this->security->get_csrf_hash();?>"/>
                <div class="form-group">
                  <button type="button" class="btn btn-primary float-right" style="margin:5px 5px 5px 5px;" id="srcBtn" onclick="search(this)">검색</button>
                  <input type="text" class="form-control col-2 float-right" style="margin:5px 5px 5px 5px;" name="srcN" id="srcN" value="" placeholder="소속명, ID, 이름을 입력해 주세요.">
                </div>
                  <table class="table table-hover">
                    <colgroup>
                      <col width="5%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                      <col width="10%"/>
                    </colgroup>
                    <thead>
                      <tr>
                        <th class="text-center">번호</th>
                        <th class="text-center">소속명</th>
                        <th class="text-center">ID</th>
                        <th class="text-center">이름</th>
                        <th class="text-center">계정상태</th>
                        <th class="text-center">이용상품명</th>
                        <th class="text-center">등록 원생수</th>
                        <th class="text-center">등록 선생수</th>
                        <th class="text-center">계약일</th>
                        <th class="text-center">만료일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php if( count($list) > 0 ){ ?>
                      {list}
                      <tr style="cursor:pointer">
                        <td class="text-center align-middle">{count}</td>
                        <td class="text-center align-middle" onclick="partnerPopup('{user_seq}')">{group_name}</td>
                        <td class="text-center align-middle">{user_id}</td>
                        <td class="text-center align-middle">{user_name}</td>
                        <td class="text-center align-middle">{user_status}</td>
                        <td class="text-center align-middle">{pricing_plan}</td>
                        <td class="text-center align-middle"  onclick="userPopup('{user_seq}')">{user_count}/{use_count}</td>
                        <td class="text-center align-middle">{teacher_count}/10</td>
                        <td class="text-center align-middle">{start_date}</td>
                        <td class="text-center align-middle">{end_date}</td>
                      </tr>
                      {/list}
                      <?php } else { ?>
                      <tr>
                        <td class="text-center" colspan="13">조회된 가맹점이 없습니다.</td>
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
                <button type="button" class="btn btn-block btn-success" onclick="excelDownload()">엑셀 다운로드</button>
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
      $('#searchForm').attr("action","userTotalDownload");
      $('#searchForm').submit();
      
      $('#searchForm').attr("action","");
    
  }
      
  function goModify($seq)
  {
      location.href="/admin/partner/modify/"+$seq;
  }

  function writeBoard()
  {
    location.href="/admin/partner/write";
  }

  function academiExcelWrite()
  {
    window.open("/admin/parnter/partnerExcel","popup_window","left=50 , top=50, width=985, height=500, scrollbars=auto");
  }
  
  function partnerPopup($seq) {
      window.open("/admin/partner/partner_popup/"+$seq, "_partner_pop", "width=1000, height=800, left=0, top=50"); 
  }  
  
  function teacherPopup($seq) {
      window.open("/admin/partner/teacher_popup/"+$seq, "_teacher_pop", "width=1000, height=800, left=0, top=50"); 
  }    
  
  function userPopup($seq) {
      window.open("/admin/partner/user_popup/"+$seq, "_user_pop", "width=1000, height=800, left=0, top=50"); 
  }      
</script>
