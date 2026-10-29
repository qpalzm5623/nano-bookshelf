/* 북퀴즈 결과 전용: 9명의 친구 × 6개의 책 속 세계 × 4가지 성취 장면.
   기존 프로필 아바타와 분리해 결과 화면의 전신 일러스트만 관리합니다. */
var NanoQuizResult = (function () {
  'use strict';

  var themes = {
    nature: { label: '자연 · 생태', ink: '#246451', paper: '#edf5ed', accent: '#739b75', sky: '#dcebdd' },
    science: { label: '과학 · 우주', ink: '#465aa0', paper: '#eef0fa', accent: '#8897d0', sky: '#dce2f5' },
    history: { label: '역사 · 문화', ink: '#8a5938', paper: '#faf1e5', accent: '#c79562', sky: '#f0dfc5' },
    mind: { label: '마음 · 공감', ink: '#9b5264', paper: '#fcf0f1', accent: '#d998a8', sky: '#f3dce1' },
    literature: { label: '문학 · 상상', ink: '#6c5794', paper: '#f3eff8', accent: '#aa95c5', sky: '#e5dcf1' },
    art: { label: '예술 · 창의', ink: '#366e83', paper: '#edf5f6', accent: '#82b3bf', sky: '#d9ebed' }
  };
  var characters = {
    nano: { name: '나노', fur: '#ed965c', dark: '#ae5838', light: '#fff2db' },
    toto: { name: '토토', fur: '#fff7ed', dark: '#c88498', light: '#f4cfda' },
    booki: { name: '부키', fur: '#6c9c86', dark: '#3d6b5b', light: '#eaf0ce' },
    pico: { name: '피코', fur: '#647c9c', dark: '#3e526f', light: '#f6f5e9' },
    popo: { name: '포포', fur: '#b89170', dark: '#76553f', light: '#f4dfbd' },
    chichi: { name: '치치', fur: '#cc9465', dark: '#97613e', light: '#fff0d1' },
    lumi: { name: '루미', fur: '#bea6de', dark: '#7b60a0', light: '#f7eaff' },
    mir: { name: '미르', fur: '#7bb7ac', dark: '#3f8078', light: '#e6efce' },
    jelly: { name: '젤리', fur: '#9acbd3', dark: '#538b9d', light: '#e9f9f6' }
  };
  var tiers = {
    perfect: { title: '책 속의 모든 순간을 찾았어요!', label: '완벽한 발견', note: '모든 문항을 맞혔어요', icon: 'trophy' },
    high: { title: '이야기를 멋지게 읽어냈어요.', label: '빛나는 이해', note: '멋진 독서 여정이었어요', icon: 'star' },
    pass: { title: '한 권 더, 한 걸음 더 자랐어요.', label: '차곡차곡 성장', note: '오늘의 독서를 인증했어요', icon: 'check' },
    retry: { title: '다음 발견이 기다리고 있어요.', label: '다시, 책 속으로', note: '잠깐 쉬어 가도 괜찮아요', icon: 'book' }
  };

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function themeFor(book) {
    // 분류 메타데이터를 우선하고, 분류가 없거나 매칭되지 않을 때 제목을 참고합니다.
    function match(text) {
      if (/자연|생태|동물|식물|환경|숲|바다|곤충|지구|공룡|반려|나무|꽃|생물/.test(text)) return 'nature';
      if (/과학|우주|발명|기술|로봇|수학|물리|화학|인공지능|\bai\b|행성|천문|실험|코딩|컴퓨터|미래/.test(text)) return 'science';
      if (/역사|사회|인물|위인|전통|문화|지리|세계|나라|조선|전쟁|법|한국사|유적|고대/.test(text)) return 'history';
      if (/마음|인성|가족|철학|감정|우정|사랑|심리|자아|도덕|행복|배려|친구|부모|인간|생활|건강|음식/.test(text)) return 'mind';
      if (/예술|음악|미술|체육|스포츠|악기|그림|디자인|공예|건축|노래|무용/.test(text)) return 'art';
      if (/문학|동화|소설|모험|판타지|상상/.test(text)) return 'literature';
      return null;
    }
    var metadata = [book.cat, book.themeTag, book.tags, book.subject].filter(Boolean).join(' ').toLowerCase();
    return match(metadata) || match(String(book.title || '').toLowerCase()) || 'literature';
  }

  function star(x, y, size, color) {
    return '<path d="M0,-10 Q2,-2 10,0 Q2,2 0,10 Q-2,2 -10,0 Q-2,-2 0,-10Z" transform="translate(' + x + ' ' + y + ') scale(' + size + ')" fill="' + color + '"/>';
  }

  function book(x, y, scale, color) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + scale + ')">' +
      '<path d="M-45,0 Q-22,-11 0,0 Q22,-11 45,0 L45,31 Q22,23 0,34 Q-22,23 -45,31Z" fill="' + color + '"/>' +
      '<path d="M-41,-5 Q-21,-13 0,-2 Q21,-13 41,-5 L41,25 Q20,19 0,29 Q-20,19 -41,25Z" fill="#fffaf0"/>' +
      '<path d="M0,-2V29 M-33,4L-9,8 M-33,11L-9,15 M9,8L33,4 M9,15L33,11" stroke="#d5c9b4" fill="none" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M25,-8V8L29,5L33,7V-9" fill="#d68e76"/></g>';
  }

  function plant(x, y, scale, color) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + scale + ')">' +
      '<path d="M0,0Q-3,-28 5,-62" fill="none" stroke="' + color + '" stroke-width="3"/>' +
      '<path d="M1,-18Q-30,-17 -25,-38Q-1,-37 1,-18 M1,-32Q25,-30 27,-51Q4,-53 1,-32 M4,-48Q-18,-50 -14,-70Q8,-67 4,-48" fill="' + color + '"/>' +
      '<path d="M-14,-3H15L11,18H-10Z" fill="#cf9d7e"/><path d="M-16,-3H17V3H-16Z" fill="#e1b695"/></g>';
  }

  function scenery(key, t) {
    var scenes = {
      nature: function () {
        return '<circle cx="346" cy="62" r="29" fill="#f4d78f"/><path d="M38,180Q111,102 202,178Q303,110 421,181V232H38Z" fill="#c6dbc1"/>' +
          '<path d="M61,199Q58,123 79,69 M78,119Q47,111 47,91Q77,86 78,119 M73,147Q106,135 108,107Q79,108 73,147" stroke="#799d78" stroke-width="5" fill="#9bbb8c" stroke-linecap="round"/>' +
          '<path d="M369,193V119" stroke="#88a078" stroke-width="5"/><path d="M369,83L337,145H401Z" fill="#a4bf91"/><path d="M369,112L331,165H408Z" fill="#86a982"/>' +
          plant(111, 214, .65, '#6f9572') + '<g fill="#fff4d1"><circle cx="335" cy="190" r="7"/><circle cx="345" cy="198" r="6"/><circle cx="332" cy="204" r="6"/></g><circle cx="337" cy="198" r="4" fill="#d8ae63"/>';
      },
      science: function () {
        return '<circle cx="354" cy="82" r="33" fill="#acb7dc"/><ellipse cx="354" cy="82" rx="52" ry="12" transform="rotate(-25 354 82)" stroke="#fff9eb" stroke-width="6" fill="none"/>' +
          '<path d="M49,203Q130,145 212,206Q302,159 429,205V237H49Z" fill="#d1d6e9"/><ellipse cx="354" cy="213" rx="31" ry="7" fill="#b6bfdc"/>' +
          '<g transform="translate(85 88) rotate(-18)"><path d="M0,35Q-18,29 -17,48L-7,44 M20,35Q38,29 37,48L27,44" fill="#c58e83"/><path d="M10,0Q-7,14 -4,42H24Q27,14 10,0Z" fill="#fff7e9"/><path d="M10,0Q1,8 -1,15H21Q19,8 10,0Z" fill="#bc8f8f"/><circle cx="10" cy="25" r="7" fill="#8498c6"/><path d="M3,46L10,62L17,46" fill="#e4bb76"/></g>' +
          '<path d="M139,61L165,41L191,64" stroke="#a2afcf" fill="none" stroke-dasharray="3 5"/>' + star(139,61,.5,'#8294c6') + star(165,41,.7,'#8294c6') + star(191,64,.4,'#8294c6');
      },
      history: function () {
        return '<circle cx="345" cy="67" r="31" fill="#edcf91"/><path d="M37,194Q132,158 225,188T428,190V232H37Z" fill="#e8d4b5"/>' +
          '<g fill="#c9ab87"><path d="M58,112L106,85L154,112Z"/><rect x="61" y="115" width="90" height="8" rx="2"/><rect x="67" y="128" width="13" height="58"/><rect x="99" y="128" width="13" height="58"/><rect x="131" y="128" width="13" height="58"/><rect x="58" y="187" width="97" height="9" rx="2"/></g>' +
          '<g transform="translate(346 149)"><circle r="29" fill="#fcf2da" stroke="#ba966b" stroke-width="3"/><circle r="22" fill="none" stroke="#d5bc93"/><path d="M0,-21L7,0L0,21L-7,0Z" fill="#bf8060"/><path d="M0,0L0,21L-7,0Z" fill="#decbb0"/><circle r="3" fill="#80664e"/></g>' +
          '<path d="M337,207h48v-10h-48Z" fill="#af886c"/><path d="M328,197h48v-9h-48Z" fill="#d5b887"/>' + plant(393,210,.55,'#9aab83');
      },
      mind: function () {
        return '<circle cx="342" cy="71" r="30" fill="#f6d8a1"/><path d="M38,201Q108,146 212,195T423,199V232H38Z" fill="#edcbd1"/>' +
          '<path d="M65,146V194H123V146L94,124Z" fill="#fffaed"/><path d="M56,148L94,116L132,148" stroke="#c68c94" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M87,194V169Q95,159 103,169V194" fill="#dab3b7"/>' +
          '<path d="M353,140C320,115 337,94 353,110C369,94 386,115 353,140Z" fill="#dca3ad"/><path d="M353,140Q343,166 355,188" stroke="#c294a2" fill="none"/>' +
          plant(379,213,.9,'#9eaf8d') + plant(135,213,.5,'#bda0b4');
      },
      literature: function () {
        return '<circle cx="344" cy="72" r="31" fill="#f3ddb2"/><circle cx="356" cy="61" r="27" fill="' + t.sky + '"/>' +
          '<path d="M33,198Q128,137 224,195T428,193V235H33Z" fill="#d7cce5"/><path d="M342,178V107H361V88L372,70L383,88V107H402V178Z" fill="#b5a2cd"/><path d="M367,178V152Q373,143 379,152V178" fill="#f7eddc"/><path d="M369,115H377V128H369Z" fill="#eee2ce"/>' +
          book(101, 130, .76, '#9f8eb7') + '<path d="M66,113Q42,94 46,78Q69,81 75,106 M125,110Q147,88 157,95Q154,114 133,121" fill="#fffaef"/>' +
          '<rect x="64" y="201" width="80" height="12" rx="3" fill="#9a89ac"/><rect x="71" y="189" width="65" height="12" rx="3" fill="#d3b29c"/>' + star(135,64,.7,'#c0a56c') + star(318,120,.5,'#fff9e7');
      },
      art: function () {
        return '<circle cx="344" cy="66" r="28" fill="#f1d397"/><path d="M35,200Q117,143 222,196T426,199V233H35Z" fill="#cadfe0"/>' +
          '<g transform="translate(70 97)"><path d="M8,108L21,0 M67,108L53,0 M12,83H65" stroke="#ad9579" stroke-width="5" stroke-linecap="round"/><rect x="0" y="10" width="76" height="65" rx="3" fill="#fffaee"/><circle cx="51" cy="31" r="12" fill="#e6bd83"/><path d="M7,66L29,38L46,58L58,46L69,66Z" fill="#8eb3a4"/></g>' +
          '<g transform="translate(355 163) rotate(-20)"><path d="M-30,3C-34,-35 34,-39 36,-5C37,7 16,1 13,14C9,39 -27,31 -30,3Z" fill="#e6c6a5"/><circle cx="20" cy="-10" r="6" fill="' + t.sky + '"/><circle cx="-13" cy="-12" r="6" fill="#a7b5ce"/><circle cx="-17" cy="6" r="6" fill="#c98f8b"/><circle cx="0" cy="15" r="6" fill="#86aa91"/></g>' +
          '<path d="M381,88V63L403,57V82" stroke="#7199a5" stroke-width="3" fill="none"/><ellipse cx="376" cy="89" rx="6" ry="4" fill="#7199a5"/><ellipse cx="398" cy="83" rx="6" ry="4" fill="#7199a5"/>';
      }
    };
    return scenes[key]();
  }

  function mascot(id, tier) {
    var c = characters[id];
    var fur = c.fur, dark = c.dark, light = c.light;
    var back = '', ears = '', face = '', accessory = '';
    // 각 친구의 실루엣과 고유 소품은 유지하되, 둥근 전신 캐릭터로 다시 그립니다.
    if (id === 'nano') {
      back = '<path d="M40,62Q100,54 84,5Q55,2 43,43" fill="' + fur + '"/><path d="M84,5Q63,3 60,20L79,28Q88,16 84,5" fill="' + light + '"/>';
      ears = '<path d="M-41,-42L-43,-84Q-19,-76 -15,-55 M41,-42L43,-84Q19,-76 15,-55" fill="' + fur + '"/><path d="M-35,-49L-36,-73L-23,-55 M35,-49L36,-73L23,-55" fill="#eab7a3"/>';
      face = '<path d="M-43,-27Q-26,-32 0,-8Q26,-32 43,-27Q36,7 0,9Q-36,7 -43,-27" fill="' + light + '"/>';
      accessory = '<g stroke="' + dark + '" stroke-width="2.5" fill="none"><circle cx="-18" cy="-29" r="13"/><circle cx="18" cy="-29" r="13"/><path d="M-5,-29H5M-31,-30L-40,-34M31,-30L40,-34"/></g><ellipse cy="-11" rx="5" ry="3.5" fill="' + dark + '"/>';
    } else if (id === 'toto') {
      ears = '<ellipse cx="-23" cy="-76" rx="12" ry="36" transform="rotate(-12 -23 -76)" fill="' + fur + '"/><ellipse cx="23" cy="-76" rx="12" ry="36" transform="rotate(12 23 -76)" fill="' + fur + '"/><path d="M-27,-94L-22,-66M27,-94L22,-66" stroke="' + light + '" stroke-width="10" stroke-linecap="round"/>';
      accessory = '<path d="M-4,-13Q0,-17 4,-13L0,-8Z" fill="#c98599"/><path d="M21,10L38,5L34,21L21,15L8,22L6,6Z" fill="#cf96a5"/>';
    } else if (id === 'booki') {
      ears = '<path d="M-42,-33L-47,-72L-15,-55M42,-33L47,-72L15,-55" fill="' + fur + '"/>';
      face = '<path d="M0,-46C-33,-76 -57,-24 -27,-5Q-10,6 0,-10Q10,6 27,-5C57,-24 33,-76 0,-46Z" fill="' + light + '"/>';
      accessory = '<path d="M-6,-15L0,-4L6,-15Z" fill="#d5a452"/><path d="M-26,28l7,5l7,-5 M4,37l7,5l7,-5 M-16,48l7,5l7,-5" fill="none" stroke="#a7bf9b" stroke-width="3" stroke-linecap="round"/>';
    } else if (id === 'pico') {
      face = '<path d="M0,-43C-30,-74 -52,-26 -30,-4Q0,17 30,-4C52,-26 30,-74 0,-43Z" fill="' + light + '"/>';
      accessory = '<path d="M-8,-12Q0,-20 8,-12L0,-5Z" fill="#e6ae61"/><path d="M-37,10Q0,28 37,10L39,23Q0,37 -39,23Z" fill="#bd8d7a"/><rect x="20" y="24" width="12" height="23" rx="3" fill="#bd8d7a"/>';
      back = '<circle cy="-28" r="59" stroke="#b5cbd5" stroke-width="3" fill="#ffffff" fill-opacity=".2"/><path d="M-45,-52Q-37,-69 -22,-74" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>';
    } else if (id === 'popo') {
      ears = '<circle cx="-36" cy="-57" r="17" fill="' + fur + '"/><circle cx="36" cy="-57" r="17" fill="' + fur + '"/><circle cx="-36" cy="-57" r="9" fill="' + light + '"/><circle cx="36" cy="-57" r="9" fill="' + light + '"/>';
      face = '<ellipse cy="-10" rx="22" ry="17" fill="' + light + '"/>';
      accessory = '<ellipse cy="-17" rx="6" ry="4" fill="' + dark + '"/><path d="M-27,16L33,50" stroke="#82674c" stroke-width="7"/><rect x="20" y="43" width="22" height="23" rx="5" fill="#987851"/>';
    } else if (id === 'chichi') {
      back = '<path d="M32,59C113,70 110,-43 67,-46C26,-49 39,6 64,-6C80,-12 73,-29 64,-23" stroke="' + dark + '" stroke-width="2" fill="' + fur + '"/><path d="M54,43Q95,20 81,-15" stroke="' + light + '" stroke-width="14" stroke-linecap="round" fill="none"/>';
      ears = '<path d="M-37,-46Q-54,-86 -22,-63 M37,-46Q54,-86 22,-63" fill="' + fur + '"/>';
      face = '<path d="M-17,-61L-11,-41M0,-65V-43M17,-61L11,-41" stroke="' + dark + '" stroke-width="5" stroke-linecap="round"/><ellipse cy="-10" rx="24" ry="18" fill="' + light + '"/>';
      accessory = '<ellipse cy="-16" rx="5" ry="3" fill="' + dark + '"/>';
    } else if (id === 'lumi') {
      back = '<path d="M-27,23C-104,-47 -88,66 -35,57 M27,23C104,-47 88,66 35,57" fill="#ded9f1" stroke="#fff4ff" stroke-width="2"/><path d="M-35,39L-63,19M35,39L63,19" stroke="#bdaeda" stroke-width="2"/>';
      ears = '<path d="M-42,-39L-62,-51L-44,-15M42,-39L62,-51L44,-15" fill="' + fur + '"/>';
      accessory = '<path d="M-39,-48Q-15,-89 25,-59Q46,-56 43,-36Q20,-40 15,-55Q-7,-35 -39,-48" fill="' + dark + '"/>' + star(0,-71,1,'#e9c780');
    } else if (id === 'mir') {
      back = '<path d="M29,62Q91,72 83,23Q108,62 66,81L22,75" fill="' + fur + '"/><path d="M-35,25L-65,2L-62,44L-37,51 M35,25L65,2L62,44L37,51" fill="#9dccba"/>';
      ears = '<path d="M-28,-55L-33,-80L-18,-64M28,-55L33,-80L18,-64" fill="#dfc89d"/><path d="M-42,-38L-59,-51L-52,-23M42,-38L59,-51L52,-23" fill="' + fur + '"/>';
      face = '<ellipse cy="-9" rx="28" ry="18" fill="' + light + '"/><circle cx="-10" cy="-13" r="2" fill="' + dark + '"/><circle cx="10" cy="-13" r="2" fill="' + dark + '"/>';
      accessory = '<path d="M-12,-60L0,-71L12,-60" fill="#508e87"/>';
    } else {
      back = '<circle cx="-55" cy="8" r="10" fill="#d5e9e9"/><circle cx="55" cy="-57" r="7" fill="#bedfe2"/><circle cx="-39" cy="-72" r="5" fill="#e3cfe8"/>';
      ears = '<path d="M-10,-60Q-25,-91 -1,-89Q18,-87 11,-61" fill="' + fur + '"/>';
      accessory = '<path d="M-29,-47Q-22,-56 -14,-54" stroke="#f4ffff" stroke-width="6" stroke-linecap="round" fill="none"/>' + star(23,-52,.65,'#fff5ca');
    }
    var eyes = tier === 'perfect'
      ? '<path d="M-24,-28Q-18,-36 -12,-28M12,-28Q18,-36 24,-28" stroke="#3f4248" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : '<ellipse cx="-18" cy="-29" rx="3.4" ry="4.5" fill="#3f4248"/><ellipse cx="18" cy="-29" rx="3.4" ry="4.5" fill="#3f4248"/><circle cx="-17" cy="-30" r="1" fill="#fff"/><circle cx="19" cy="-30" r="1" fill="#fff"/>';
    var mouth = tier === 'perfect'
      ? '<path d="M-7,-2Q0,15 7,-2Z" fill="#925f58"/><path d="M-4,3Q0,0 4,3" stroke="#e8a799" stroke-width="3"/>'
      : '<path d="M-5,-2Q0,3 5,-2" stroke="#6c5550" stroke-width="2" stroke-linecap="round" fill="none"/>';
    var leftArm = tier === 'perfect' ? 'M-31,23Q-61,7 -60,-17' : tier === 'high' ? 'M-31,23Q-56,26 -60,5' : 'M-31,23Q-48,42 -23,49';
    var rightArm = tier === 'perfect' || tier === 'high' ? 'M31,23Q57,6 58,-17' : 'M31,23Q48,42 23,49';
    var props = tier === 'retry' ? book(0, 37, .8, dark)
      : tier === 'pass' ? '<path d="M-18,41H18L14,65H-14Z" fill="#d6a081"/><path d="M0,43V19 M0,31Q-24,30 -20,13Q-2,12 0,31 M0,24Q21,20 18,5Q0,6 0,24" stroke="#6c9670" stroke-width="2" fill="#8daf80"/>'
      : tier === 'high' ? star(60,-34,1.7,'#e5bd70') + '<path d="M60,-18L55,5" stroke="#bd955e" stroke-width="3"/>'
      : '<g transform="translate(0 -92)"><path d="M-22,2L-24,-17L-10,-8L0,-25L10,-8L24,-17L22,2Z" fill="#e6bf72"/><path d="M-22,4H22" stroke="#c89b51" stroke-width="4" stroke-linecap="round"/>' + star(0,-9,.5,'#fff2ce') + '</g>';
    var lift = tier === 'perfect' ? -8 : 0;
    return '<g class="qr-mascot" transform="translate(232 ' + (157 + lift) + ')">' + back +
      '<ellipse cx="-20" cy="75" rx="16" ry="9" fill="' + dark + '"/><ellipse cx="20" cy="75" rx="16" ry="9" fill="' + dark + '"/>' +
      '<path d="M-29,7Q-45,29 -36,63Q0,83 36,63Q45,29 29,7Z" fill="' + fur + '"/><ellipse cy="43" rx="25" ry="28" fill="' + light + '"/>' + ears +
      '<path d="M-46,-28C-48,-78 48,-78 46,-28Q45,12 0,14Q-45,12 -46,-28Z" fill="' + fur + '"/>' + face + eyes +
      '<ellipse cx="-31" cy="-13" rx="7" ry="4" fill="#e8a49c" opacity=".65"/><ellipse cx="31" cy="-13" rx="7" ry="4" fill="#e8a49c" opacity=".65"/>' + mouth + accessory +
      '<path d="' + leftArm + ' M' + rightArm.substring(1) + '" fill="none" stroke="' + fur + '" stroke-width="16" stroke-linecap="round"/>' + props + '</g>';
  }

  function illustration(themeKey, charId, tier) {
    var t = themes[themeKey];
    var decorations = tier === 'perfect'
      ? '<g fill="#d4ad6e"><path d="M152,71l-5,-9l5,-2l4,9Z M304,46l4,-9l5,2l-4,9Z M324,164l8,-5l3,5l-8,5Z"/></g>' + star(165,35,.7,'#e4bc72') + star(297,100,.8,'#e4bc72') + star(149,153,.6,t.accent)
      : tier === 'high' ? star(155,88,.8,'#d4ad6e') + star(299,59,.6,t.accent)
      : tier === 'pass' ? '<path d="M154,176Q138,160 151,150Q164,161 154,176 M304,181Q320,166 312,155Q295,163 304,181" fill="' + t.accent + '"/>'
      : '<path d="M143,93Q152,86 161,93 M303,92Q312,85 321,92" fill="none" stroke="' + t.accent + '" stroke-width="2" stroke-linecap="round"/>';
    return '<svg class="qr-scene" viewBox="0 0 464 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-character="' + charId + '" data-tier="' + tier + '">' +
      '<path d="M33,215V124C33,3 431,3 431,124V215Z" fill="' + t.sky + '"/>' +
      '<path d="M54,76Q68,59 84,69Q91,45 116,58Q133,54 143,76Z M284,45Q296,29 310,40Q322,18 339,36Q353,30 366,45Z" fill="#fffaf1" opacity=".75"/>' +
      scenery(themeKey,t) + '<ellipse cx="232" cy="232" rx="169" ry="15" fill="' + t.accent + '" opacity=".12"/><ellipse cx="232" cy="233" rx="58" ry="9" fill="' + t.ink + '" opacity=".12"/>' +
      decorations + mascot(charId,tier) + '</svg>';
  }

  function icon(name) {
    var paths = {
      trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3Zm4 9v6m-4 3h8M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
      check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
      book: '<path d="M12 6Q7 2 3 5v14q4-3 9 0 5-3 9 0V5q-4-3-9 1Zm0 0v13"/>',
      coin: '<circle cx="12" cy="12" r="9"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths[name] + '</svg>';
  }

  function render(score, charId, currentBook, extra) {
    currentBook = currentBook || {};
    extra = extra || {};
    score = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
    charId = Object.prototype.hasOwnProperty.call(characters, charId) ? charId : 'nano';
    var tier = score === 100 ? 'perfect' : score >= 80 ? 'high' : score >= 60 ? 'pass' : 'retry';
    var themeKey = themeFor(currentBook), t = themes[themeKey], state = tiers[tier];
    var isPass = typeof extra.isPass === 'boolean' ? extra.isPass : score >= 60;
    var total = Number.isFinite(extra.tot) ? Math.max(0, Math.floor(extra.tot)) : 5;
    var correct = Number.isFinite(extra.ok) ? Math.max(0, Math.min(total, Math.floor(extra.ok))) : Math.round(total * score / 100);
    var points = Number.isFinite(extra.earnedPts) ? Math.max(0, extra.earnedPts) : 0;
    var failCount = Number.isFinite(extra.failCount) ? Math.max(0, extra.failCount) : 0;
    var name = characters[charId].name;
    var speech = extra.speechText || (isPass ? '오늘 발견한 이야기가 내일의 너를 더 자라게 할 거야.' : '서두르지 않아도 괜찮아. 책을 다시 펼치고 함께 찾아보자!');
    var segments = Array.from({ length: total }, function (_, i) { return '<span class="' + (i < correct ? 'is-filled' : '') + '"></span>'; }).join('');
    return '<section class="qr-card qr-theme-' + themeKey + ' qr-tier-' + tier + '" style="--qr-ink:' + t.ink + ';--qr-paper:' + t.paper + ';--qr-accent:' + t.accent + '">' +
      '<div class="qr-heading"><div class="qr-eyebrow"><span>북퀴즈 완료</span><span class="qr-theme-label">' + icon('book') + t.label + '</span></div>' +
      '<h2 class="qr-book-title">' + escape(currentBook.title || '선택 도서') + '</h2><p class="qr-headline">' + state.title + '</p></div>' +
      '<div class="qr-artwork">' + illustration(themeKey,charId,tier) + '<div class="qr-achievement">' + icon(state.icon) + '<span>' + state.label + '</span></div></div>' +
      '<div class="qr-summary"><div class="qr-score"><span class="qr-label">나의 점수</span><div><strong>' + score + '</strong><span class="qr-score-unit">점 <span>/ 100</span></span></div></div>' +
      '<div class="qr-reward"><span class="qr-label">획득 포인트</span><strong>' + icon('coin') + '+' + points.toLocaleString('ko-KR') + '<small>P</small></strong><span class="qr-reward-note">' + (points > 0 ? '독서의 즐거움이 차곡차곡' : isPass ? '이번에 지급된 포인트가 없어요' : '60점 이상이면 받을 수 있어요') + '</span></div></div>' +
      '<div class="qr-progress"><div class="qr-progress-label"><span><strong>' + correct + '</strong> / ' + total + '문항 정답</span><span class="qr-certification">' + icon(isPass ? 'check' : 'book') + (isPass ? '도서 인증 완료' : '60점부터 도서 인증') + '</span></div><div class="qr-segments" aria-hidden="true">' + segments + '</div></div>' +
      '<div class="qr-message"><span class="qr-message-name">' + name + '의 한마디</span><p>' + escape(speech) + '</p></div>' +
      (!isPass ? '<p class="qr-retry-note">' + (failCount >= 3 ? '오늘은 3회 도전했어요. 자정 이후에 다시 도전할 수 있어요.' : '오늘 실패 ' + failCount + '/3회 · 책을 다시 읽고 도전해 보세요.') + '</p>' : '') + '</section>';
  }

  return { render: render, illustration: illustration, themes: themes, characters: characters, tiers: tiers };
}());
