/* 프로필과 북퀴즈가 공유하는 나노 프렌즈 일러스트.
   9명의 친구 × 성장 3단계. 점수는 표정·동작만 바꾸고 성장 모습은 유지합니다. */
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
    lumi: { name: '냥이', fur: '#aaa8c8', dark: '#64617f', light: '#f6f1eb' },
    mir: { name: '미르', fur: '#7bb7ac', dark: '#3f8078', light: '#e6efce' },
    jelly: { name: '양양', fur: '#f4ead7', dark: '#9b8575', light: '#fffaf0' }
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
    if (typeof NanoReading !== 'undefined') {
      var genre = NanoReading.genre(book);
      if (genre === 'hist') return /역사|전래|신화|전통|문화/.test([book.themeName, book.themeTag, book.subject, book.tags].join(' ')) ? 'history' : 'literature';
      return { nature: 'nature', tech: 'science', human: 'mind', health: 'mind', study: 'art' }[genre];
    }
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

  function normalizeStage(stage) {
    return Number.isFinite(stage) ? Math.max(1, Math.min(3, Math.floor(stage))) : 1;
  }

  // 단계가 오르면 각 친구의 생활과 도구가 자랍니다. 공통 왕관·망토는 사용하지 않습니다.
  function growthArtwork(id, stage, c) {
    var master = stage === 3, growing = stage > 1;
    var back = '', outfit = '', head = '', prop = '';
    if (id === 'nano') {
      outfit = growing
        ? '<path d="M-28,12L-9,18L0,40L9,18L28,12L33,59L8,65L0,52L-8,65L-33,59Z" fill="' + (master ? '#536f65' : '#8da58e') + '"/><path d="M-17,16L-5,40L-19,33M17,16L5,40L19,33" fill="#d6ddc3"/><path d="M11,43H25V54H11Z" fill="#3f5d55"/><circle cy="46" r="2.5" fill="#e9c58e"/>'
        : '<path d="M-20,12L0,20L20,12L13,28L0,24L-13,28Z" fill="#66877b"/>';
      head = master ? '<path d="M-32,-64Q-26,-88 -4,-78Q16,-85 28,-66L39,-60Q4,-65 -38,-57Z" fill="#526e63"/><path d="M-27,-66Q0,-73 27,-65" stroke="#b7c7ae" stroke-width="3" fill="none"/>' : '';
      prop = '<g class="qr-signature-prop" transform="translate(42 38) rotate(-14)"><path d="M0,12V29" stroke="#6b4c37" stroke-width="7" stroke-linecap="round"/><circle r="15" fill="#d8e8dc" fill-opacity=".9" stroke="' + (master ? '#bb955a' : '#6d7a64') + '" stroke-width="4"/><path d="M-8,-4Q-6,-10 1,-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>';
      if (growing) outfit += '<g transform="translate(-20 47) rotate(-9)"><rect x="-11" y="-11" width="23" height="29" rx="3" fill="#c6a477"/><path d="M-5,-3H6M-5,3H6M-5,9H2" stroke="#fff0cc" stroke-width="2"/><path d="M-7,-11V18" stroke="#8b6a4f" stroke-width="2"/></g>';
    } else if (id === 'toto') {
      outfit = growing ? '<path d="M-23,14L29,58" stroke="#af697d" stroke-width="7"/><rect x="-37" y="39" width="36" height="29" rx="8" fill="' + (master ? '#a9657d' : '#cd91a5') + '"/><path d="M-35,41L-19,54L-2,41" fill="none" stroke="#f4d5d7" stroke-width="2"/>' : '<path d="M-12,14L0,20L12,14L10,27L0,23L-10,27Z" fill="#c58d9f"/>';
      head = growing ? '<g transform="translate(31 -61)"><path d="M-4,1Q-20,-15 -16,-22Q0,-20 4,-5Q13,-20 21,-15Q22,-3 6,3" fill="' + (master ? '#c9859b' : '#e5b5c1') + '"/><circle r="5" fill="#f5dfb7"/></g>' : '';
      prop = '<g class="qr-signature-prop" transform="translate(27 43) rotate(-12)"><rect x="-18" y="-12" width="36" height="26" rx="3" fill="#fff9ed" stroke="#d3bdab" stroke-width="1.5"/><path d="M-16,-10L0,3L16,-10" fill="none" stroke="#c8a7a6" stroke-width="1.5"/><circle cy="3" r="3" fill="#bd8396"/></g>';
      if (master) back = '<g transform="translate(-43 31)"><path d="M0,32L-5,-7M0,32L12,0" stroke="#7b9a76" stroke-width="3"/><path d="M-1,16Q-17,4 -18,17Q-9,24 -1,16M4,22Q18,10 19,22Q11,29 4,22" fill="#9eb190"/><g fill="#d9a0ac"><circle cx="-6" cy="-11" r="12"/><circle cx="12" cy="-2" r="9"/></g><circle cx="-6" cy="-11" r="4" fill="#fff1c4"/><circle cx="12" cy="-2" r="3" fill="#fff1c4"/></g>';
    } else if (id === 'booki') {
      back = growing ? '<path d="M-31,11Q-77,8 -69,58Q-52,58 -28,41M31,11Q77,8 69,58Q52,58 28,41" fill="' + (master ? '#436d60' : '#59816b') + '"/><path d="M-38,22L-59,47M38,22L59,47M-47,25L-49,36L-60,34M47,25L49,36L60,34" stroke="#a6bd8a" stroke-width="2" fill="none"/>' : '';
      if (master) back = '<path d="M-31,8Q-71,-5 -83,23L-69,27L-82,43L-62,42L-68,59Q-40,64 -25,35M31,8Q71,-5 83,23L69,27L82,43L62,42L68,59Q40,64 25,35" fill="#436d60"/><path d="M-36,18L-67,44M36,18L67,44M-47,21L-48,31L-64,28M47,21L48,31L64,28M-57,35L-59,44L-71,40M57,35L59,44L71,40" stroke="#b1c58d" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      outfit = '<path d="M-20,26L-13,33L-6,26M4,38L11,45L18,38M-12,49L-5,56L2,49" stroke="#aec1a0" stroke-width="3" fill="none" stroke-linecap="round"/>';
      head = growing ? '<path d="M-37,-54Q-54,-75 -45,-87Q-28,-83 -25,-61M37,-54Q54,-75 45,-87Q28,-83 25,-61" fill="#4f7b65"/><path d="M-43,-78L-32,-61M43,-78L32,-61" stroke="#b5c991" stroke-width="2"/>' : '';
      if (master) head += '<path d="M-17,-62Q0,-80 17,-62Q3,-57 -17,-62" fill="#9eaf7c"/><path d="M0,-62V-74" stroke="#59765e" stroke-width="2"/>';
      prop = '<g class="qr-signature-prop">' + book(0, 39, growing ? .66 : .52, '#537963') + (master ? '<path d="M17,43Q3,34 8,24Q22,27 17,43" fill="#87a16f"/><path d="M14,29L17,43" stroke="#527959" stroke-width="1.5"/>' : '') + '</g>';
    } else if (id === 'pico') {
      outfit = growing ? '<path d="M-29,13Q0,26 29,13L31,61Q0,76 -31,61Z" fill="#e6eeeb" stroke="#a4b9be" stroke-width="2"/><rect x="-17" y="30" width="34" height="23" rx="6" fill="#4d7189"/><circle cx="-7" cy="41" r="4" fill="#e4bc73"/><path d="M3,37H11M3,43H11" stroke="#d3e5df" stroke-width="2" stroke-linecap="round"/>' : '<path d="M-32,12Q0,25 32,12L30,23Q0,35 -30,23Z" fill="#bc8973"/>';
      head = growing ? '<path d="M-52,-18Q-60,-85 0,-89Q60,-85 52,-18" fill="none" stroke="#8eaab5" stroke-width="4"/><rect x="-58" y="-32" width="10" height="23" rx="5" fill="#6c8b9a"/><rect x="48" y="-32" width="10" height="23" rx="5" fill="#6c8b9a"/><path d="M53,-31L61,-61" stroke="#72949f" stroke-width="3"/><circle cx="62" cy="-64" r="5" fill="#e6bb75"/>' : '';
      back = master ? '<g fill="#789baa" stroke="#d3e3df" stroke-width="1.5"><path d="M-34,20L-74,8L-78,42L-38,54ZM34,20L74,8L78,42L38,54Z"/><path d="M-55,14L-58,48M55,14L58,48M-76,25L-36,37M76,25L36,37" fill="none"/></g>' : '';
      prop = '<g class="qr-signature-prop" transform="translate(28 42) rotate(9)"><rect x="-15" y="-18" width="30" height="38" rx="5" fill="#426177"/><rect x="-11" y="-13" width="22" height="25" rx="2" fill="#c3dedb"/><path d="M-7,4L-2,-2L3,1L8,-7" fill="none" stroke="#4b8c8d" stroke-width="2"/><circle cy="16" r="1.8" fill="#c7d9d6"/></g>';
    } else if (id === 'popo') {
      outfit = growing ? '<path d="M-31,14L-10,20L0,35L10,20L31,14L33,62L12,68L0,58L-12,68L-33,62Z" fill="' + (master ? '#8c7d61' : '#c4ac82') + '"/><path d="M-23,39H-9V53H-23M9,39H23V53H9" fill="#e7d6b5"/><path d="M-25,14L30,58" stroke="#77583f" stroke-width="6"/>' : '<path d="M-24,16L28,57" stroke="#84654d" stroke-width="6"/><rect x="17" y="45" width="25" height="23" rx="5" fill="#9d7b55"/>';
      head = master ? '<path d="M-33,-62L-27,-82Q0,-91 27,-82L33,-62Z" fill="#ad9570"/><path d="M-29,-70H29" stroke="#756149" stroke-width="5"/><path d="M-43,-61Q0,-69 43,-61" stroke="#977b58" stroke-width="7" stroke-linecap="round"/>' : '';
      prop = '<g class="qr-signature-prop" transform="translate(7 44) rotate(-7)"><path d="M-30,-16L-11,-11L9,-17L29,-12V18L9,13L-11,19L-30,14Z" fill="#f1dfb9" stroke="#b49971" stroke-width="1.5"/><path d="M-11,-11V19M9,-17V13" stroke="#c6b086" stroke-width="1.5"/><path d="M-22,5Q-12,-8 -3,5T18,0" stroke="#a88765" stroke-width="2" fill="none" stroke-dasharray="3 3"/><circle cx="18" r="3" fill="#ac7357"/></g>';
      if (master) back = '<g transform="translate(-47 24) rotate(-10)"><rect x="-9" y="-18" width="18" height="56" rx="4" fill="#dbbd8c"/><path d="M-12,-17H12M-12,37H12" stroke="#8c6d4c" stroke-width="5" stroke-linecap="round"/></g>';
    } else if (id === 'chichi') {
      outfit = growing ? '<path d="M-18,12H18L21,29L29,64Q0,76 -29,64L-21,29Z" fill="' + (master ? '#648671' : '#9bb291') + '"/><path d="M-14,12L-20,32M14,12L20,32" stroke="#e7e1bb" stroke-width="5"/><path d="M-15,43H15V59Q0,65 -15,59Z" fill="#c8d2ad"/>' : '<path d="M-25,12L0,22L25,12L16,31L0,24L-16,31Z" fill="#d7b770"/>';
      head = growing ? '<path d="M-35,-63Q0,-73 35,-63" stroke="#d5b370" stroke-width="7" stroke-linecap="round"/><path d="M16,-67Q12,-87 27,-89Q36,-74 16,-67" fill="#7f9d6d"/>' : '';
      prop = '<g class="qr-signature-prop" transform="translate(22 45)"><path d="M-15,-3Q0,-15 15,-3L11,18Q0,28 -11,18Z" fill="#b97d4f"/><path d="M-17,-3Q0,-21 17,-3L15,3H-15Z" fill="#88633e"/><path d="M0,-12V-22Q11,-25 15,-18Q10,-11 0,-15" fill="#789866" stroke="#789866" stroke-width="2"/></g>';
      if (master) back = '<g transform="translate(-58 32)"><path d="M-17,-3Q-21,-30 -8,-25Q0,-17 -4,-2M-3,-3Q0,-38 14,-34Q23,-17 9,-2" fill="#8da77b"/><path d="M-22,-2H22L17,30Q0,37 -17,30Z" fill="#c2a075"/><path d="M-20,5H20M-19,14H19M-17,23H17M-9,0L-7,31M3,0V33M13,0L11,31" stroke="#e1c39a" stroke-width="2"/><path d="M-20,-2Q0,-21 20,-2" fill="none" stroke="#a5825b" stroke-width="3"/></g>';
      if (master) outfit += '<g transform="translate(-23 47)"><path d="M-9,0L0,22L9,0Z" fill="#d5a065"/><path d="M0,0L-6,-12M0,0L6,-14" stroke="#76946a" stroke-width="4" stroke-linecap="round"/></g>';
    } else if (id === 'lumi') {
      outfit = '<path d="M-24,11Q0,24 24,11L22,20Q0,31 -22,20Z" fill="' + (master ? '#6d7295' : '#9298b4') + '"/><path d="M0,22L7,31L0,40L-7,31Z" fill="#e4c48f"/><circle cy="31" r="2" fill="#fff8e8"/>';
      if (growing) outfit += '<path d="M-27,19L23,58" stroke="#7c799a" stroke-width="4"/><rect x="12" y="44" width="27" height="25" rx="5" fill="#85829e"/><path d="M18,51H31M18,57H27" stroke="#ddd8eb" stroke-width="2"/>';
      head = master ? '<path d="M-29,-60Q0,-73 29,-60" stroke="#7b7899" stroke-width="3" fill="none"/><g transform="translate(31 -57)"><path d="M-7,-7H7V7H-7Z" fill="#c4b4d1" transform="rotate(45)"/><circle r="3" fill="#f7eccf"/></g>' : '';
      prop = growing ? '<g class="qr-signature-prop" transform="translate(-23 39) rotate(-10)"><path d="M-18,19L0,-15L19,19Z" fill="#d9cfb4"/><path d="M-8,12L0,-2L8,12Z" fill="#f8f5ec"/><path d="M-12,14L-9,15M-6,4L-3,5M0,-7L3,-6" stroke="#9e8c70" stroke-width="1.5"/></g>' : '';
      if (master) prop = '<g class="qr-signature-prop" transform="translate(-28 39) rotate(-10)"><rect x="-21" y="-19" width="42" height="39" rx="5" fill="#757998"/><path d="M-13,10L0,-12L13,10Z" fill="none" stroke="#e3d1aa" stroke-width="2"/><path d="M-13,10H13M0,-12V10" stroke="#d2d9e8" stroke-width="1.5"/><circle cy="4" r="6" fill="none" stroke="#d2d9e8" stroke-width="1.5"/></g>';
      if (master) back = '<g transform="translate(-58 0)"><ellipse rx="27" ry="10" transform="rotate(-35)" stroke="#b5a3cb" stroke-width="2" fill="none"/><circle cx="-15" cy="11" r="5" fill="#d9c58e"/></g>';
    } else if (id === 'mir') {
      head = growing ? '<path d="M-26,-57Q-44,-70 -39,-93M26,-57Q44,-70 39,-93M-39,-78L-51,-84M39,-78L51,-84" stroke="#d8c9a1" stroke-width="7" stroke-linecap="round" fill="none"/>' : '';
      if (master) head += '<path d="M-40,-90L-49,-99M40,-90L49,-99M-34,-64L-53,-69M34,-64L53,-69" stroke="#d8c9a1" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M-41,-44Q-65,-28 -57,-8M41,-44Q65,-28 57,-8" fill="none" stroke="#c1d7bf" stroke-width="6" stroke-linecap="round"/>';
      outfit = '<path d="M-21,26Q0,38 21,26M-22,38Q0,50 22,38M-19,50Q0,62 19,50" fill="none" stroke="#b3cdb3" stroke-width="3"/>';
      prop = growing ? '<g class="qr-signature-prop" transform="translate(0 43)"><circle r="' + (master ? '19' : '14') + '" fill="#e9ddad" stroke="#c2ad6d" stroke-width="2"/><path d="M-9,2Q-1,-10 9,-2Q1,10 -9,2" fill="#fff5d1"/><circle cx="-4" cy="-7" r="3" fill="#fffaf0"/></g>' : '';
      if (master) back = '<path d="M-35,17Q-68,6 -61,43L-45,32L-40,55M35,17Q68,6 61,43L45,32L40,55" fill="#82b69e" stroke="#558b7d" stroke-width="2"/>';
    } else if (id === 'jelly') {
      outfit = growing ? '<path d="M-23,16L29,54" stroke="#a18a77" stroke-width="6"/><rect x="10" y="40" width="34" height="30" rx="7" fill="' + (master ? '#9e8f9c' : '#b3a291') + '"/><path d="M14,47H40M14,55H40M14,63H40M20,43V68M28,43V68M36,43V68" stroke="#d9cabb" stroke-width="1.5"/>' : '<path d="M-15,15L0,21L15,15L11,27L0,25L-11,27Z" fill="#a7ada0"/>';
      head = growing ? '<g transform="translate(32 -52)"><path d="M0,4Q-18,-8 -12,-18Q1,-15 2,-3Q12,-14 20,-8Q17,4 0,4" fill="#9eaf97"/><circle r="4" fill="#e5c997"/></g>' : '';
      prop = '<g class="qr-signature-prop" transform="translate(-18 43) rotate(-9)"><rect x="-15" y="-17" width="30" height="37" rx="4" fill="' + (master ? '#8b7f9b' : '#a5a58f') + '"/><path d="M-9,-17V20" stroke="#d8cfb9" stroke-width="2"/><path d="M5,-17V-2L9,-6L12,-2V-17" fill="#dab990"/><path d="M-3,4H9M-3,9H6" stroke="#e9e2d2" stroke-width="2" stroke-linecap="round"/></g>';
      if (master) back = '<g transform="translate(45 30)"><rect x="-6" y="-4" width="20" height="31" rx="3" fill="#bb9d7e"/><path d="M-3,0H14M-3,5H14M-3,10H14" stroke="#f7ecd7" stroke-width="2"/><path d="M6,-4V9L10,6L13,9V-4" fill="#839b8f"/></g>';
    }
    return { back: back, outfit: outfit, head: head, prop: prop };
  }

  function mascot(id, tier, stage) {
    stage = normalizeStage(stage);
    var c = characters[id], growth = growthArtwork(id, stage, c);
    var fur = c.fur, dark = c.dark, light = c.light;
    var back = '', ears = '', face = '', accessory = '';
    var headShape = 'M-46,-28C-48,-78 48,-78 46,-28Q45,12 0,14Q-45,12 -46,-28Z';
    var bodyShape = 'M-29,7Q-45,29 -36,63Q0,83 36,63Q45,29 29,7Z';
    var feet = '<ellipse cx="-20" cy="75" rx="16" ry="9" fill="' + dark + '"/><ellipse cx="20" cy="75" rx="16" ry="9" fill="' + dark + '"/>';
    if (id === 'nano') {
      back = '<path d="M34,61C109,70 105,4 73,-7Q76,28 34,38Z" fill="' + fur + '"/><path d="M73,-7Q77,8 70,24L91,29Q97,4 73,-7" fill="' + light + '"/>';
      ears = '<path d="M-40,-41L-44,-85Q-22,-76 -14,-53M40,-41L44,-85Q22,-76 14,-53" fill="' + fur + '"/><path d="M-35,-49L-37,-73L-23,-54M35,-49L37,-73L23,-54" fill="#d7907e"/>';
      headShape = 'M-42,-42Q-29,-73 0,-65Q29,-73 42,-42L54,-21Q33,13 0,14Q-33,13 -54,-21Z';
      face = '<path d="M-51,-24Q-31,-31 0,-8Q31,-31 51,-24Q31,12 0,12Q-31,12 -51,-24" fill="' + light + '"/>';
      accessory = '<g stroke="#6e5e4c" stroke-width="2.5" fill="none"><circle cx="-19" cy="-29" r="14"/><circle cx="19" cy="-29" r="14"/><path d="M-5,-29H5M-33,-30L-42,-34M33,-30L42,-34"/></g><path d="M-5,-13Q0,-17 5,-13L0,-8Z" fill="' + dark + '"/>';
    } else if (id === 'toto') {
      ears = '<ellipse cx="-23" cy="-78" rx="11" ry="34" transform="rotate(-12 -23 -78)" fill="' + fur + '"/><path d="M17,-51Q7,-112 27,-110Q47,-105 39,-69L29,-54" fill="' + fur + '"/><path d="M-27,-96L-22,-66M24,-95Q32,-96 30,-69" stroke="#ebbec8" stroke-width="8" fill="none" stroke-linecap="round"/>';
      headShape = 'M-39,-32Q-40,-64 0,-62Q40,-64 39,-32Q46,12 0,14Q-46,12 -39,-32Z';
      accessory = '<path d="M-4,-13Q0,-17 4,-13L0,-8Z" fill="#c98599"/><path d="M0,-8V-4" stroke="#b47c8d" stroke-width="1.5"/>';
      feet = '<ellipse cx="-21" cy="74" rx="19" ry="10" fill="#e8d7cc"/><ellipse cx="21" cy="74" rx="19" ry="10" fill="#e8d7cc"/>';
    } else if (id === 'booki') {
      ears = '<path d="M-42,-34L-47,-72L-15,-55M42,-34L47,-72L15,-55" fill="' + fur + '"/>';
      headShape = 'M-48,-29Q-53,-65 -23,-62Q0,-54 23,-62Q53,-65 48,-29Q42,14 0,15Q-42,14 -48,-29Z';
      bodyShape = 'M-33,5Q-53,33 -36,64L-15,72L0,64L15,72L36,64Q53,33 33,5Z';
      face = '<path d="M0,-44C-32,-73 -56,-24 -29,-4Q-9,9 0,-8Q9,9 29,-4C56,-24 32,-73 0,-44Z" fill="' + light + '"/>';
      accessory = '<path d="M-6,-14L0,-3L6,-14Z" fill="#cba05b"/>';
      feet = '<path d="M-17,65V77M-17,75L-26,79M-17,75L-9,79M17,65V77M17,75L26,79M17,75L9,79" stroke="#bba16d" stroke-width="5" stroke-linecap="round"/>';
    } else if (id === 'pico') {
      bodyShape = 'M-29,-1Q-49,19 -43,57Q-35,80 0,80Q35,80 43,57Q49,19 29,-1Z';
      headShape = 'M-43,-27Q-45,-68 0,-65Q45,-68 43,-27Q46,14 0,18Q-46,14 -43,-27Z';
      face = '<path d="M0,-43C-25,-70 -49,-25 -28,-3Q0,18 28,-3C49,-25 25,-70 0,-43Z" fill="' + light + '"/>';
      accessory = '<path d="M-9,-13Q0,-19 9,-13L0,-4Z" fill="#dba66a"/>';
      feet = '<path d="M-13,68Q-28,64 -38,78Q-22,87 -6,78M13,68Q28,64 38,78Q22,87 6,78" fill="#d0a171"/>';
    } else if (id === 'popo') {
      ears = '<circle cx="-36" cy="-57" r="17" fill="' + fur + '"/><circle cx="36" cy="-57" r="17" fill="' + fur + '"/><circle cx="-36" cy="-57" r="9" fill="' + light + '"/><circle cx="36" cy="-57" r="9" fill="' + light + '"/>';
      headShape = 'M-48,-27Q-49,-69 0,-65Q49,-69 48,-27Q49,16 0,18Q-49,16 -48,-27Z';
      bodyShape = 'M-31,6Q-51,32 -40,67Q0,89 40,67Q51,32 31,6Z';
      face = '<ellipse cy="-10" rx="25" ry="19" fill="' + light + '"/>';
      accessory = '<ellipse cy="-17" rx="7" ry="4.5" fill="' + dark + '"/><path d="M0,-13V-6" stroke="' + dark + '" stroke-width="2"/>';
    } else if (id === 'chichi') {
      back = '<path d="M30,63C105,72 114,-33 76,-45C38,-57 30,-5 59,-2C80,0 80,-26 67,-21" stroke="' + dark + '" stroke-width="2" fill="' + fur + '"/><path d="M51,48Q95,23 84,-11" stroke="' + light + '" stroke-width="13" stroke-linecap="round" fill="none"/>';
      ears = '<path d="M-37,-44Q-54,-80 -25,-64M37,-44Q54,-80 25,-64" fill="' + fur + '"/>';
      headShape = 'M-41,-34Q-40,-69 0,-64Q40,-69 41,-34Q56,-7 34,8Q0,23 -34,8Q-56,-7 -41,-34Z';
      face = '<path d="M-16,-60L-11,-44M0,-64V-44M16,-60L11,-44" stroke="' + dark + '" stroke-width="4" stroke-linecap="round"/><ellipse cy="-8" rx="28" ry="19" fill="' + light + '"/>';
      accessory = '<ellipse cy="-15" rx="5" ry="3" fill="' + dark + '"/>';
    } else if (id === 'lumi') {
      back = '<path d="M29,63C82,91 96,33 74,17C58,4 49,19 59,29" fill="none" stroke="' + fur + '" stroke-width="18" stroke-linecap="round"/><path d="M77,58L82,49M72,70L80,65" stroke="#8582a3" stroke-width="7" stroke-linecap="round"/>';
      ears = '<path d="M-39,-37L-42,-84Q-20,-80 -11,-55M39,-37L42,-84Q20,-80 11,-55" fill="' + fur + '"/><path d="M-33,-52L-35,-72L-21,-56M33,-52L35,-72L21,-56" fill="#d9b9c1"/>';
      headShape = 'M-42,-38Q-28,-67 0,-62Q28,-67 42,-38L48,-19Q43,11 0,14Q-43,11 -48,-19Z';
      face = '<path d="M-17,-60L-10,-47M0,-62V-46M17,-60L10,-47" stroke="#8582a3" stroke-width="4" stroke-linecap="round"/><path d="M-22,-13Q-11,-21 0,-10Q11,-21 22,-13Q24,7 0,8Q-24,7 -22,-13" fill="' + light + '"/>';
      accessory = '<path d="M-4,-13Q0,-16 4,-13L0,-9Z" fill="#b48e99"/><path d="M0,-9V-5M-31,-13L-48,-17M-32,-6L-49,-5M31,-13L48,-17M32,-6L49,-5" fill="none" stroke="#78738d" stroke-width="1.5" stroke-linecap="round"/>';
    } else if (id === 'mir') {
      back = '<path d="M27,65Q86,84 85,32Q109,68 67,84L22,77" fill="' + fur + '"/><path d="M67,77L69,66L79,71L82,58L91,61" fill="#4e8c80"/><path d="M-35,24L-58,7L-55,44L-36,50M35,24L58,7L55,44L36,50" fill="#9cc5ab"/>';
      ears = '<path d="M-29,-53L-32,-76L-17,-61M29,-53L32,-76L17,-61" fill="#dfcba3"/><path d="M-40,-36L-58,-47L-50,-20M40,-36L58,-47L50,-20" fill="' + fur + '"/>';
      headShape = 'M-43,-30Q-43,-67 0,-64Q43,-67 43,-30L49,-8Q38,21 0,20Q-38,21 -49,-8Z';
      face = '<ellipse cy="-6" rx="29" ry="20" fill="' + light + '"/><circle cx="-11" cy="-11" r="2" fill="' + dark + '"/><circle cx="11" cy="-11" r="2" fill="' + dark + '"/>';
      accessory = '<path d="M-13,-59L0,-72L13,-59" fill="#508e87"/>';
    } else if (id === 'jelly') {
      // 양의 얼굴과 양털을 분리해 표정은 또렷하고 실루엣은 포근하게 유지합니다.
      ears = '<path d="M-29,-38Q-66,-53 -59,-27Q-43,-15 -29,-30M29,-38Q66,-53 59,-27Q43,-15 29,-30" fill="#cdb7a4"/><path d="M-39,-34L-53,-34M39,-34L53,-34" stroke="#dec4bc" stroke-width="6" stroke-linecap="round"/>';
      headShape = 'M-38,-25Q-43,-57 -22,-60Q-6,-79 11,-63Q35,-68 41,-43Q58,-23 42,-6Q43,17 22,17Q0,32 -20,17Q-43,18 -43,-5Q-57,-17 -38,-25Z';
      bodyShape = 'M-27,9Q-46,5 -43,29Q-58,44 -43,57Q-43,77 -23,74Q0,89 23,74Q43,77 43,57Q58,44 43,29Q46,5 27,9Z';
      if (stage === 3) {
        headShape = 'M-41,-29Q-59,-39 -45,-58Q-47,-77 -27,-77Q-11,-93 5,-77Q27,-93 39,-73Q60,-69 48,-47Q66,-27 46,-12Q48,14 24,19Q0,35 -24,19Q-49,17 -45,-6Q-65,-13 -41,-29Z';
        bodyShape = 'M-30,8Q-56,6 -49,30Q-64,48 -48,61Q-48,81 -26,77Q0,93 26,77Q48,81 48,61Q64,48 49,30Q56,6 30,8Z';
      }
      face = '<path d="M-29,-31Q-30,-49 0,-46Q30,-49 29,-31L26,-10Q22,9 0,11Q-22,9 -26,-10Z" fill="#cdb7a4"/><path d="M-32,-42Q-45,-59 -26,-65Q-12,-81 0,-66Q18,-79 27,-61Q45,-58 32,-41Q19,-35 12,-45Q0,-34 -10,-45Q-21,-34 -32,-42Z" fill="#fffaf0" stroke="#deceb6" stroke-width="1.4" stroke-linejoin="round"/>';
      accessory = '<path d="M-4,-13Q0,-16 4,-13L0,-9Z" fill="#8d786b"/><path d="M-32,-4Q-40,5 -30,11M32,-4Q40,5 30,11" fill="none" stroke="#e1d3ba" stroke-width="2" stroke-linecap="round"/>';
      feet = '<rect x="-30" y="65" width="18" height="17" rx="8" fill="#a58c79"/><rect x="12" y="65" width="18" height="17" rx="8" fill="#a58c79"/>';
      if (stage === 3) face += '<path d="M-38,-25Q-46,-34 -36,-40M38,-25Q46,-34 36,-40M-29,9Q-21,17 -15,9M15,9Q21,17 29,9" stroke="#e0d1b6" stroke-width="2" fill="none" stroke-linecap="round"/>';
    }
    var woolOutline = id === 'jelly' ? ' stroke="#d8c8ae" stroke-width="1.5" stroke-linejoin="round"' : '';
    var eyeColor = id === 'jelly' ? '#544b45' : '#383e44';
    var eyes = '<g class="qr-eyes-normal">' + (tier === 'perfect'
      ? '<path d="M-24,-27Q-18,-33 -12,-27M12,-27Q18,-33 24,-27" stroke="' + eyeColor + '" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<ellipse cx="-18" cy="-28" rx="4.3" ry="5.7" fill="' + eyeColor + '"/><ellipse cx="18" cy="-28" rx="4.3" ry="5.7" fill="' + eyeColor + '"/><circle cx="-16.6" cy="-30" r="1.5" fill="#fff"/><circle cx="19.4" cy="-30" r="1.5" fill="#fff"/>') + '</g>';
    if (tier !== 'portrait') eyes += '<g class="qr-eyes-joy" opacity="0"><path d="M-24,-27Q-18,-34 -12,-27M12,-27Q18,-34 24,-27" stroke="' + eyeColor + '" stroke-width="3" fill="none" stroke-linecap="round"/></g>';
    var mouth = '<path d="M-5,-2Q0,4 5,-2" stroke="' + (id === 'jelly' ? '#8d786b' : '#79645b') + '" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
    var armPaths = {
      nano: ['M-31,25Q-43,36 -26,44', 'M31,25Q44,31 42,40', 'M-31,25Q-45,17 -42,0', 'M31,25Q46,31 42,40'],
      toto: ['M-28,25Q-39,45 -18,47', 'M28,25Q41,35 29,44', 'M-28,25Q-49,16 -46,-4', 'M28,25Q41,35 29,44'],
      booki: ['M-33,20Q-43,37 -24,47', 'M33,20Q43,37 24,47', 'M-33,20Q-55,4 -60,14', 'M33,20Q55,4 60,14'],
      pico: ['M-32,24Q-49,35 -40,52', 'M32,24Q46,36 29,46', 'M-32,24Q-57,10 -49,-3', 'M32,24Q46,36 29,46'],
      popo: ['M-32,25Q-45,44 -24,47', 'M32,25Q45,44 24,47', 'M-32,25Q-47,25 -46,12', 'M32,25Q45,44 24,47'],
      chichi: ['M-30,23Q-41,41 -19,46', 'M30,23Q45,36 28,44', 'M-30,23Q-47,10 -40,-5', 'M30,23Q45,36 28,44'],
      lumi: ['M-30,25Q-43,38 -25,45', 'M30,25Q45,42 26,49', 'M-30,25Q-43,38 -25,45', 'M30,25Q51,10 45,-4'],
      mir: ['M-32,25Q-40,44 -18,46', 'M32,25Q40,44 18,46', 'M-32,25Q-48,36 -25,43', 'M32,25Q48,36 25,43'],
      jelly: ['M-31,25Q-42,41 -20,46', 'M31,25Q45,41 26,50', 'M-31,25Q-42,41 -20,46', 'M31,25Q48,31 42,16']
    }[id];
    var arms = '<g class="qr-arms-normal"><path d="' + armPaths[0] + ' ' + armPaths[1] + '"/></g>' + (tier === 'portrait' ? '' : '<g class="qr-arms-joy" opacity="0"><path d="' + armPaths[2] + ' ' + armPaths[3] + '"/></g>');
    return '<g class="qr-mascot" data-friend="' + id + '" data-stage="' + stage + '" data-mood="' + tier + '" transform="translate(232 157)"><g class="qr-mascot-motion">' +
      '<g class="qr-part-back">' + back + growth.back + '</g>' + feet +
      '<path d="' + bodyShape + '" fill="' + fur + '"' + woolOutline + '/><ellipse cy="42" rx="25" ry="27" fill="' + light + '"/>' + growth.outfit +
      '<g class="qr-face-motion"><g class="qr-part-ears">' + ears + '</g>' +
      '<path d="' + headShape + '" fill="' + fur + '"' + woolOutline + '/>' + face +
      '<g class="qr-part-eyes">' + eyes + '</g>' +
      '<ellipse cx="-31" cy="-12" rx="6" ry="3.5" fill="#d99f93" opacity=".35"/><ellipse cx="31" cy="-12" rx="6" ry="3.5" fill="#d99f93" opacity=".35"/>' + mouth + accessory +
      '<g class="qr-part-head">' + growth.head + '</g></g>' +
      '<g class="qr-part-arms" fill="none" stroke="' + fur + '" stroke-width="' + (id === 'toto' ? 13 : 16) + '" stroke-linecap="round">' + arms + '</g>' + growth.prop + '</g></g>';
  }

  function avatar(charId, size, stage) {
    charId = Object.prototype.hasOwnProperty.call(characters, charId) ? charId : 'nano';
    size = Number.isFinite(size) ? Math.max(16, Math.min(400, size)) : 60;
    stage = normalizeStage(stage);
    var c = characters[charId];
    return '<svg class="nano-friend-avatar" viewBox="112 6 240 250" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + c.name + ' ' + stage + '단계" focusable="false">' +
      '<rect x="117" y="15" width="230" height="230" rx="85" fill="' + c.light + '" fill-opacity=".55"/><ellipse class="qr-mascot-shadow" cx="232" cy="237" rx="62" ry="9" fill="' + c.dark + '" fill-opacity=".1"/>' + mascot(charId, 'portrait', stage) + '</svg>';
  }

  // 추천은 각 친구가 자기 방식으로 응답합니다. 효과도 캐릭터의 도구와 이야기를 따릅니다.
  function celebrationArtwork(id) {
    var effects = {
      nano: '<g transform="translate(327 104)"><circle r="24" fill="#f8f5df" stroke="#a3b393" stroke-width="1.5"/><circle r="17" fill="none" stroke="#bdc7aa" stroke-dasharray="3 5"/><path d="M-9,0L-2,7L11,-8" stroke="#668573" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g><path d="M296,131L311,120" stroke="#9cae8c" stroke-width="2" stroke-dasharray="3 4"/>',
      toto: '<path d="M305,153Q362,124 325,81" stroke="#c399a5" stroke-width="1.5" stroke-dasharray="3 5" fill="none"/><g transform="translate(326 84) rotate(-18)"><rect x="-19" y="-13" width="38" height="27" rx="3" fill="#fff8e8" stroke="#c99aa5" stroke-width="1.5"/><path d="M-17,-11L0,3L17,-11" stroke="#c99aa5" stroke-width="1.5" fill="none"/><circle cy="3" r="3" fill="#bc8499"/></g><path d="M142,106Q130,96 136,85Q149,89 142,106" fill="#a1b594"/>',
      booki: '<path d="M130,161Q116,119 141,87M329,158Q345,119 325,96" stroke="#7b9b78" stroke-width="2" fill="none"/><path d="M125,138Q103,127 110,112Q130,115 125,138M129,116Q149,107 153,118Q146,132 129,127M137,95Q126,76 142,71Q154,82 137,95M337,134Q358,122 354,109Q334,111 337,134M332,114Q313,100 310,113Q316,125 332,124" fill="#9db48b"/>',
      pico: '<g transform="translate(331 97) rotate(-25)"><circle r="16" fill="#b6cbd2"/><ellipse rx="34" ry="9" fill="none" stroke="#e2c48f" stroke-width="3"/><circle cx="-30" cy="-4" r="4" fill="#f9f3df"/></g><path d="M132,155L132,107L157,92" stroke="#91b2ba" stroke-width="1.5" fill="none" stroke-dasharray="3 5"/><circle cx="157" cy="92" r="4" fill="#d3b77b"/>',
      popo: '<g transform="translate(332 108)"><circle r="24" fill="#f6e7c8" stroke="#b99d74" stroke-width="1.5"/><circle r="18" fill="none" stroke="#d8c09a"/><path d="M0,-17L6,0L0,17L-6,0Z" fill="#ab7559"/><path d="M0,0V17L-6,0Z" fill="#d8c6a4"/><circle r="2.5" fill="#725d47"/></g><path d="M125,151Q102,107 150,95" stroke="#bc9a73" stroke-width="2" fill="none" stroke-dasharray="3 5"/>',
      chichi: '<g transform="translate(135 145)"><path d="M0,11V-20M0,-8Q-24,-12 -19,-28Q2,-26 0,-8M0,-17Q18,-38 27,-23Q25,-6 0,-11" fill="#95b280" stroke="#74946b" stroke-width="1.5"/><path d="M-14,11H14L10,28H-10Z" fill="#caa080"/></g><g transform="translate(332 116) rotate(20)"><ellipse cy="3" rx="9" ry="13" fill="#b98a5a"/><path d="M-11,-2Q0,-18 11,-2V2H-11Z" fill="#896c48"/><path d="M0,-10V-17" stroke="#896c48" stroke-width="3"/></g>',
      lumi: '<g transform="translate(328 103)"><path d="M-21,18V-18H15V18Z" fill="none" stroke="#b7abc9" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M-21,18L15,-18V18Z" fill="#c1b5d4"/><path d="M-21,-18H15L-21,18Z" fill="#e3c897"/><circle cx="24" cy="-26" r="7" fill="none" stroke="#9eacc4" stroke-width="2"/></g><path d="M134,106L143,89L152,106Z" fill="none" stroke="#a99bc2" stroke-width="2"/>',
      mir: '<path d="M119,169Q132,146 151,166Q164,178 177,165M292,170Q307,150 323,166Q342,185 356,163M129,177Q143,166 158,179M312,181Q328,172 343,183" stroke="#8eb6a5" stroke-width="3" fill="none" stroke-linecap="round"/><g transform="translate(325 91)"><circle r="19" fill="#f2e5ba"/><path d="M-10,2Q0,-12 10,-2Q0,13 -10,2" fill="#d7c28a"/></g>',
      jelly: '<path d="M125,151C108,122 154,108 153,130C152,150 115,128 130,106C139,90 158,90 164,78" fill="none" stroke="#baa7bc" stroke-width="2" stroke-linecap="round"/>' + book(331, 113, .48, '#a99bb6') + '<path d="M328,108V124L332,120L336,124V107" fill="#c5ab81"/>'
    };
    return '<g class="qr-signature-effect qr-effect-' + id + '" opacity="0" aria-hidden="true">' + effects[id] + '</g>';
  }

  function illustration(themeKey, charId, tier, stage) {
    stage = normalizeStage(stage);
    var t = themes[themeKey];
    var decorations = tier === 'perfect'
      ? '<g fill="#d4ad6e"><path d="M152,71l-5,-9l5,-2l4,9Z M304,46l4,-9l5,2l-4,9Z M324,164l8,-5l3,5l-8,5Z"/></g>' + star(165,35,.7,'#e4bc72') + star(297,100,.8,'#e4bc72') + star(149,153,.6,t.accent)
      : tier === 'high' ? star(155,88,.8,'#d4ad6e') + star(299,59,.6,t.accent)
      : tier === 'pass' ? '<path d="M154,176Q138,160 151,150Q164,161 154,176 M304,181Q320,166 312,155Q295,163 304,181" fill="' + t.accent + '"/>'
      : '<path d="M143,93Q152,86 161,93 M303,92Q312,85 321,92" fill="none" stroke="' + t.accent + '" stroke-width="2" stroke-linecap="round"/>';
    var joyBurst = celebrationArtwork(charId);
    return '<svg class="qr-scene" viewBox="0 0 464 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-character="' + charId + '" data-tier="' + tier + '">' +
      '<path d="M33,215V124C33,3 431,3 431,124V215Z" fill="' + t.sky + '"/>' +
      '<path d="M54,76Q68,59 84,69Q91,45 116,58Q133,54 143,76Z M284,45Q296,29 310,40Q322,18 339,36Q353,30 366,45Z" fill="#fffaf1" opacity=".75"/>' +
      scenery(themeKey,t) + '<ellipse cx="232" cy="232" rx="169" ry="15" fill="' + t.accent + '" opacity=".12"/><ellipse class="qr-mascot-shadow" cx="232" cy="233" rx="58" ry="9" fill="' + t.ink + '" opacity=".12"/>' +
      decorations + mascot(charId,tier,stage) + joyBurst + '</svg>';
  }

  function icon(name) {
    var paths = {
      trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3Zm4 9v6m-4 3h8M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
      check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
      book: '<path d="M12 6Q7 2 3 5v14q4-3 9 0 5-3 9 0V5q-4-3-9 1Zm0 0v13"/>',
      coin: '<circle cx="12" cy="12" r="9"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>',
      thumb: '<path d="M7 10v11M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>'
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
    var isSecondPass = extra.isSecondPass === true;
    var isRecommended = extra.isRecommended === true;
    var bookIdAttr = escape(currentBook.bookNo || currentBook.id || '');
    var total = Number.isFinite(extra.tot) ? Math.max(0, Math.floor(extra.tot)) : 5;
    var correct = Number.isFinite(extra.ok) ? Math.max(0, Math.min(total, Math.floor(extra.ok))) : Math.round(total * score / 100);
    var points = Number.isFinite(extra.earnedPts) ? Math.max(0, extra.earnedPts) : 0;
    var failCount = Number.isFinite(extra.failCount) ? Math.max(0, extra.failCount) : 0;
    var name = characters[charId].name;
    var speech = extra.speechText || (isPass ? '오늘 발견한 이야기가 내일의 너를 더 자라게 할 거야.' : '서두르지 않아도 괜찮아. 책을 다시 펼치고 함께 찾아보자!');
    var segments = Array.from({ length: total }, function (_, i) { return '<span class="' + (i < correct ? 'is-filled' : '') + '"></span>'; }).join('');
    var recBtnTitle = isPass
      ? (isRecommended ? '추천을 취소하려면 다시 눌러 주세요' : '재미있게 읽었다면 따봉을 눌러 친구들에게 추천해 보세요!')
      : '60점 이상 도서 인증 완료 시 추천할 수 있어요';
    var recBtnHtml = '<button type="button" id="btnQuizRecommend" class="qr-recommend-btn' +
      (isRecommended ? ' is-recommended' : '') +
      (!isPass ? ' is-disabled' : '') +
      '" data-book-id="' + bookIdAttr + '"' +
      (isPass ? ' onclick="handleQuizBookRecommend(this)"' : ' disabled aria-disabled="true"') +
      ' aria-pressed="' + isRecommended + '" title="' + recBtnTitle + '">' +
      '<span class="qr-rec-icon">' + icon('thumb') + '</span>' +
      '<span class="qr-rec-text">' + (isRecommended ? '추천 완료' : '추천하기') + '</span>' +
      '</button>';
    var round2NoticeHtml = isSecondPass
      ? '<div class="qr-notice-round2" style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:11px 14px;margin:12px 0 6px;display:flex;align-items:center;gap:10px;color:#92400e;font-size:12.5px;line-height:1.5;box-shadow:0 2px 8px rgba(245,158,11,0.08);text-align:left;"><svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span style="font-weight:700;">북퀴즈를 2회째 완료했습니다. 3회차부터는 포인트가 쌓이지 않습니다.</span></div>'
      : '';
    var rewardNote = isSecondPass
      ? '북퀴즈를 2회째 완료했습니다. 3회차부터는 포인트가 쌓이지 않습니다.'
      : (points > 0 ? '독서의 즐거움이 차곡차곡' : isPass ? '이번에 지급된 포인트가 없어요' : '60점 이상이면 받을 수 있어요');
    return '<section class="qr-card qr-theme-' + themeKey + ' qr-tier-' + tier + '" style="--qr-ink:' + t.ink + ';--qr-paper:' + t.paper + ';--qr-accent:' + t.accent + '">' +
      '<div class="qr-heading"><div class="qr-eyebrow"><span>북퀴즈 완료</span><div class="qr-eyebrow-actions"><span class="qr-theme-label">' + icon('book') + t.label + '</span>' + recBtnHtml + '</div></div>' +
      '<h2 class="qr-book-title">' + escape(currentBook.title || '선택 도서') + '</h2><p class="qr-headline">' + state.title + '</p></div>' +
      '<div class="qr-artwork">' + illustration(themeKey,charId,tier,extra.stage) + '<div class="qr-achievement">' + icon(state.icon) + '<span>' + state.label + '</span></div></div>' +
      '<div class="qr-summary"><div class="qr-score"><span class="qr-label">나의 점수</span><div><strong>' + score + '</strong><span class="qr-score-unit">점 <span>/ 100</span></span></div></div>' +
      '<div class="qr-reward"><span class="qr-label">획득 포인트</span><strong>' + icon('coin') + '+' + points.toLocaleString('ko-KR') + '<small>P</small></strong><span class="qr-reward-note">' + rewardNote + '</span></div></div>' +
      round2NoticeHtml +
      '<div class="qr-progress"><div class="qr-progress-label"><span><strong>' + correct + '</strong> / ' + total + '문항 정답</span><span class="qr-certification">' + icon(isPass ? 'check' : 'book') + (isPass ? '도서 인증 완료' : '60점부터 도서 인증') + '</span></div><div class="qr-segments" aria-hidden="true">' + segments + '</div></div>' +
      '<div class="qr-message"><span class="qr-message-name">' + name + '의 한마디</span><p>' + escape(speech) + '</p></div>' +
      (!isPass ? '<p class="qr-retry-note">' + (failCount >= 3 ? '오늘은 3회 도전했어요. 자정 이후에 다시 도전할 수 있어요.' : '오늘 실패 ' + failCount + '/3회 · 책을 다시 읽고 도전해 보세요.') + '</p>' : '') + '</section>';
  }

  return { render: render, avatar: avatar, illustration: illustration, themes: themes, characters: characters, tiers: tiers };
}());
