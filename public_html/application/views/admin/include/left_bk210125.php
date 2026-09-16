<!-- Main Sidebar Container -->
<aside class="main-sidebar sidebar-dark-primary elevation-4">
  <!-- Brand Logo -->
  <a href="{base_url}admin/main" class="brand-link text-center "  >
    <span class="brand-text font-weight-light">HRD LMS</span>
  </a>

  <!-- Sidebar -->
  <div class="sidebar">
    <!-- Sidebar Menu -->
    <nav class="mt-2">
      <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
        <!-- Add icons to the links using the .nav-icon class
             with font-awesome or any other icon font library -->
        <li class="nav-item has-treeview <?php echo $depth1=="admin" ? "menu-open" : ""; ?>">
          <a href="{base_url}admin/adminList" class="nav-link <?php echo $depth1=="admin" ? "active" : ""; ?>">
            <i class="nav-icon fas fa-users-cog"></i>
            <p>
              관리자 관리
              <i class="right fas fa-angle-left"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="{base_url}admin/adminList" class="nav-link <?php echo $depth2=="adminList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>운영자관리</p>
              </a>
            </li>
          </ul>
        </li>
        <li class="nav-item has-treeview <?php echo $depth1=="management" ? "menu-open" : ""; ?>">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-edit"></i>
            <p>
              운영 관리
              <i class="right fas fa-angle-left"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/categoryList" class="nav-link <?php echo $depth2=="categoryList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>카테고리 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/productList" class="nav-link <?php echo $depth2=="productList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>상품 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/mainBannerList" class="nav-link <?php echo $depth2=="main" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>메인 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/brandMainList" class="nav-link <?php echo $depth2=="brandMain" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>브랜드 메인 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/productMainList" class="nav-link <?php echo $depth2=="productMain" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>프로덕트 메인 관리</p>
              </a>
            </li>
          </ul>
        </li>
        <li class="nav-item has-treeview <?php echo $depth1=="member" ? "menu-open" : ""; ?>">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-user"></i>
            <p>
              회원 관리
              <i class="right fas fa-angle-left"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/brandMemberList" class="nav-link <?php echo $depth2=="brandMember" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>브랜드 회원 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/buyerMemberList" class="nav-link <?php echo $depth2=="buyerMember" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>바이어 회원 관리</p>
              </a>
            </li>
            <!--
            <li class="nav-item">
              <a href="#" class="nav-link">
                <i class="far fa-circle nav-icon"></i>
                <p>탈퇴 회원 관리</p>
              </a>
            </li>
          -->
          </ul>
        </li>
        <li class="nav-item has-treeview <?php echo $depth1=="order" ? "menu-open" : ""; ?>">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-clipboard-list"></i>
            <p>
              주문 & 문의 관리
              <i class="right fas fa-angle-left"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/requestList" class="nav-link <?php echo $depth2=="requestList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>주문 요청 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/orderList" class="nav-link <?php echo $depth2=="orderList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>주문 관리</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/qnaList" class="nav-link <?php echo $depth2=="qnaList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>문의 관리</p>
              </a>
            </li>
          </ul>
        </li>
        <li class="nav-item has-treeview <?php echo $depth1=="board" ? "menu-open" : ""; ?>">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-file"></i>
            <p>
              뉴스 관리
              <i class="right fas fa-angle-left"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/boardsList/editor" class="nav-link <?php echo $depth2=="editorList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>Editor's Pick</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/boardsList/news" class="nav-link <?php echo $depth2=="newsList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>News</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="/admin/boardsList/global" class="nav-link <?php echo $depth2=="globalList" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>K trend</p>
              </a>
            </li>
          </ul>
        </li>
        <li class="nav-item has-treeview <?php echo $depth1=="infoModify" ? "menu-open" : ""; ?>">
          <a href="#" class="nav-link">
            <i class="nav-icon fas fa-id-card"></i>
            <p>
              개인정보 수정
              <i class="right fas fa-angle-left"></i>
            </p>
          </a>
          <ul class="nav nav-treeview">
            <li class="nav-item">
              <a href="/admin/infoModify" class="nav-link <?php echo $depth2=="infoModify" ? "active" : ""; ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>개인정보 수정</p>
              </a>
            </li>
            <li class="nav-item">
              <a href="javascript:logout();" class="nav-link">
                <i class="far fa-circle nav-icon"></i>
                <p>로그아웃</p>
              </a>
            </li>
          </ul>
        </li>
        <!--
        <li class="nav-header">게시판 리스트</li>
        <?php if( count($board_list) > 0 ){ ?>
          <?php for($i=0; $i < count($board_list); $i++){?>
            <li class="nav-item">
              <a href="{base_url}admin/board/<?php echo $board_list[$i]["board_name"]; ?>" class="nav-link  <?php echo $depth1=="board_".$board_list[$i]["board_name"] ? "active" : ""; ?>">
                <i class="nav-icon fas fa-file"></i>
                <p><?php echo $board_list[$i]["board_title"]; ?></p>
              </a>
            </li>
          <?php } ?>
        <?php } ?>
      -->
      </ul>
    </nav>
    <!-- /.sidebar-menu -->
  </div>
  <!-- /.sidebar -->
</aside>
