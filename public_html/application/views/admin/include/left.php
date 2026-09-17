<!-- Main Sidebar Container -->
<aside class="main-sidebar sidebar-dark-primary elevation-4">
  <!-- Brand Logo -->
  <a href="/admin" class="brand-link text-center" style="background-color: #ffffff; padding: 10px 15px; display: flex; align-items: center; justify-content: center; height: 57px;">
    <img src="/resources/images/common/logo.png" alt="나노의 책장" class="brand-image" style="max-height: 36px; width: auto; float: none; margin: 0 auto; object-fit: contain;">
  </a>
  <!-- Sidebar -->
  <div class="sidebar">
    <!-- Sidebar Menu -->
    <nav class="mt-2">
      <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
        <?php if($this->session->userdata("admin_level") == "0" || ($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director")){ ?>
        <li class="nav-item has-treeview  menu-open">
          <a href="/admin/main" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              대시보드
              <i class="right fas"></i>
            </p>
          </a>
        </li>        
        <?php }?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              <?php if($this->session->userdata("admin_level") == "0"){ ?>
              가맹점 관리
              <?php } else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
              계정 관리
              <?php } else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){ ?>
              내정보
              <?php } else if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "teacher"){ ?>
              계정관리
              <?php } ?>
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <?php if($this->session->userdata("admin_level") == "0"){ ?>
            <li class="nav-item">
              <a href="/admin/partner/list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>가맹점 등록/조회</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/partner/total_list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="total_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>사용현황리스트</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/member/list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="memberList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>가맹점 원생리스트</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/member/history_list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="historyList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>계정 생성 이력</p>
              </a>
            </li>            
            <?php } ?>
            <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
            <li class="nav-item">
              <a href="/admin/partner/write" class="nav-link <?php echo $depth1=='partner'&&$depth2=="list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>내정보</p>
              </a>
            </li>            
            <li class="nav-item">
              <a href="/admin/partner/teacher_list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="teacherList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>선생님 등록/조회</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/member/list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="memberList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>원생 등록/조회</p>
              </a>
            </li>            
            <?php } ?>
            
            <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){ ?>
            <li class="nav-item">
              <a href="/admin/partner/write" class="nav-link <?php echo $depth1=='partner'&&$depth2=="list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>내정보</p>
              </a>
            </li>            
            <?php } ?>
            <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "teacher"){ ?>
            <li class="nav-item">
              <a href="/admin/partner/write" class="nav-link <?php echo $depth1=='partner'&&$depth2=="list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>내정보</p>
              </a>
            </li>            
            <li class="nav-item">
              <a href="/admin/member/list" class="nav-link <?php echo $depth1=='partner'&&$depth2=="memberList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>원생 등록/조회</p>
              </a>
            </li>
            <?php } ?>            
          </ul>
        </li>
        <?php if($this->session->userdata("admin_level") == "0"){ ?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              마스터 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <?php if($this->session->userdata("admin_level")<=1){ ?>
            <li class="nav-item">
              <a href="/admin/master/list" class="nav-link <?php echo $depth1=='master'&&$depth2=="list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>마스터 등록/조회</p>
              </a>
            </li>
          <?php } ?>
            <li class="nav-item">
              <a href="/admin/master/quiz_confirm_list" class="nav-link <?php echo $depth1=='master'&&$depth2=="quiz_confirm_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>마스터 퀴즈관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/master/payment_list" class="nav-link <?php echo $depth1=='master'&&$depth2=="paymentList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>결제 내역 관리</p>
              </a>
            </li>
          </ul>
        </li>        
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              운영 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <?php if($this->session->userdata("admin_level")<=1){ ?>
            <li class="nav-item">
              <a href="/admin/manage/banner_list" class="nav-link <?php echo $depth1=='manage'&&$depth2=="banner_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>배너관리</p>
              </a>
            </li>
          <?php } ?>
            <li class="nav-item">
              <a href="/admin/manage/topic_list" class="nav-link <?php echo $depth1=='manage'&&$depth2=="topic_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>책주제관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/manage/ranking" class="nav-link <?php echo $depth1=='manage'&&$depth2=="ranking" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>랭킹 조회</p>
              </a>
            </li>            
          </ul>
        </li>            
        <?php } ?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              콘텐츠관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <?php if($this->session->userdata("admin_level") == "0" || ($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director")){ ?>
            <li class="nav-item">
              <a href="/admin/content/book_list" class="nav-link <?php echo $depth2=="book_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>도서 등록/조회</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/quiz_list" class="nav-link <?php echo $depth2=="quiz_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 등록/조회</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/quiz_result_list" class="nav-link <?php echo $depth2=="quiz_result_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 이력/결과</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/quiz_portfolio" class="nav-link <?php echo $depth2=="quiz_portfolio" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 포트폴리오</p>
              </a>
            </li>
            <?php } ?>
            <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "master"){ ?>
            <li class="nav-item">
              <a href="/admin/content/book_list" class="nav-link <?php echo $depth2=="book_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>도서 등록/조회</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/quiz_write" class="nav-link <?php echo $depth2=="quiz_write" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 등록</p>
              </a>
            </li>            
            <li class="nav-item">
              <a href="/admin/content/quiz_list" class="nav-link <?php echo $depth2=="quiz_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 승인여부</p>
              </a>
            </li>            
            <?php } ?>
            <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "teacher"){ ?>
            <li class="nav-item">
              <a href="/admin/content/quiz_result_list" class="nav-link <?php echo $depth2=="quiz_result_list" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 이력/결과</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/quiz_portfolio" class="nav-link <?php echo $depth2=="quiz_portfolio" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>북퀴즈 포트폴리오</p>
              </a>
            </li>
            <?php } ?>
          </ul>
        </li>
        <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              비공개 북퀴즈 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/content/quiz_share" class="nav-link <?php echo $depth2=="quizShare" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>비공개 북퀴즈 공유하기</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/quiz_share_mylist" class="nav-link <?php echo $depth2=="quizShareMyList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>내가 공유 받은 북퀴즈</p>
              </a>
            </li>
          </ul>
        </li>        
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              인증 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/content/book_assign" class="nav-link <?php echo $depth2=="bookAssign" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>도서 배정</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/book_assign_list" class="nav-link <?php echo $depth2=="bookAssignList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>도서 배정 인증 현황</p>
              </a>
            </li>
          </ul>
        </li>                
        <?php } ?>
        <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-credit-card"></i>
            <p>
              결제 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/partner/payment" class="nav-link <?php echo $depth1=='partner'&&$depth2=="payment" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>요금제 및 결제</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/partner/payment_history" class="nav-link <?php echo $depth1=='partner'&&$depth2=="paymentHistory" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>결제 내역</p>
              </a>
            </li>
          </ul>
        </li>
        <?php } ?>
        <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "teacher"){ ?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              인증 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/content/book_assign" class="nav-link <?php echo $depth2=="bookAssign" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>도서 배정</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/content/book_assign_list" class="nav-link <?php echo $depth2=="bookAssignList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>도서 배정 인증 현황</p>
              </a>
            </li>
          </ul>
        </li>     
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              기타 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/manage/ranking" class="nav-link <?php echo $depth2=='ranking' ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>랭킹 조회</p>
              </a>
            </li>                    
            <li class="nav-item">
              <a href="/admin/etc/noticeAppList" class="nav-link <?php echo $depth2=="noticeAppList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>학원 공지사항</p>
              </a>
            </li> 
            <!--
            <li class="nav-item">
              <a href="/admin/etc/qnaList" class="nav-link <?php echo $depth2=="qnaList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>고객센터</p>
              </a>            
            </li>
            -->
          </ul>
        </li>                   
        <?php } ?>
        <?php if($this->session->userdata("admin_level") == "0" || ($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director")){ ?>
        <li class="nav-item has-treeview menu-open">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              기타 관리
              <i class="right fas fa-angle-down"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <?php if($this->session->userdata("admin_type") != "A" && $this->session->userdata("admin_level") == "director"){ ?>
            <li class="nav-item">
              <a href="/admin/manage/ranking" class="nav-link <?php echo $depth2=='ranking' ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>랭킹 조회</p>
              </a>
            </li>                    
            <li class="nav-item">
              <a href="/admin/etc/noticeAppList" class="nav-link <?php echo $depth2=="noticeAppList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>학원 공지사항</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/etc/noticeList" class="nav-link <?php echo $depth2=="noticeList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>본사 공지사항</p>
              </a>
            </li>                        
            <li class="nav-item">
              <a href="/admin/etc/message_list?type=receive" class="nav-link <?php echo $depth2=="messageList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>쪽지함</p>
              </a>         
            </li>   
            <!--
            <li class="nav-item">
              <a href="/admin/etc/qnaList" class="nav-link <?php echo $depth2=="qnaList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>고객센터</p>
              </a>            
            </li>
            -->
            <li class="nav-item">
              <a href="/admin/etc/adminQnaList" class="nav-link <?php echo $depth2=="adminQnaList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>관리자 고객센터</p>
              </a>
            </li>             
            <?php } ?>
            <?php if($this->session->userdata("admin_level")=="0"){ ?>
            <li class="nav-item">
              <a href="/admin/etc/termsWrite" class="nav-link <?php echo $depth2=="termsWrite" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>이용약관</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/etc/noticeList" class="nav-link <?php echo $depth2=="noticeList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>공지사항</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/etc/faqList" class="nav-link <?php echo $depth2=="faqList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>FAQ관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/etc/qnaList" class="nav-link <?php echo $depth2=="qnaList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>앱 문의사항</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/etc/adminQnaList" class="nav-link <?php echo $depth2=="adminQnaList" ? "active" : "" ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>관리자 고객센터</p>
              </a>
            </li>
            <?php } ?>
          </ul>
        </li>
        <?php } ?>
      </ul>
    </nav>
    <!-- /.sidebar-menu -->
  </div>
  <!-- /.sidebar -->
</aside>
