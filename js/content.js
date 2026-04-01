// 한글나라 학습 콘텐츠 데이터

var USER_NAME = '서연';  // 보호자 모드에서 변경 가능

const CHAPTERS = [
  { id:'prep', title:'준비', emoji:'✏️', order:0, unlock:'none',
    lessons:['prep_lines','prep_circles'] },
  { id:'stage1_consonants', title:'자음', emoji:'ㄱ', order:1, unlock:'chapter_complete:prep',
    lessons:['consonant_set_1','consonant_set_2','consonant_set_3'] },
  { id:'stage1_vowels', title:'모음', emoji:'ㅏ', order:2, unlock:'chapter_complete:stage1_consonants',
    lessons:['vowel_set_1','vowel_set_2'] },
  { id:'stage2', title:'쉬운 음절', emoji:'가', order:3, unlock:'chapter_complete:stage1_vowels',
    lessons:['syllable_set_ga','syllable_set_na','syllable_set_da'] },
];

const LESSONS = {
  prep_lines: { title:'선 긋기', threshold:3, items:[
    { id:'prep_h', char:'─', name:'가로선', type:'PREP', tts:'가로선을 그어보자' },
    { id:'prep_v', char:'│', name:'세로선', type:'PREP', tts:'세로선을 그어보자' },
    { id:'prep_d', char:'╲', name:'대각선', type:'PREP', tts:'대각선을 그어보자' },
    { id:'prep_z', char:'⚡', name:'지그재그', type:'PREP', tts:'지그재그로 그어보자' },
  ]},
  prep_circles: { title:'동그라미', threshold:2, items:[
    { id:'prep_o', char:'○', name:'원', type:'PREP', tts:'동그라미를 그려보자' },
    { id:'prep_sp', char:'🌀', name:'나선', type:'PREP', tts:'빙글빙글 그려보자' },
  ]},
  consonant_set_1: { title:'ㄱ ㄴ ㄷ ㄹ ㅁ', threshold:4, items:[
    { id:'c_g', char:'ㄱ', name:'기역', type:'CHAR', tts:'기역', word:'기차', emoji:'🚂' },
    { id:'c_n', char:'ㄴ', name:'니은', type:'CHAR', tts:'니은', word:'나비', emoji:'🦋' },
    { id:'c_d', char:'ㄷ', name:'디귿', type:'CHAR', tts:'디귿', word:'다리', emoji:'🌉' },
    { id:'c_r', char:'ㄹ', name:'리을', type:'CHAR', tts:'리을', word:'라면', emoji:'🍜' },
    { id:'c_m', char:'ㅁ', name:'미음', type:'CHAR', tts:'미음', word:'모자', emoji:'🧢' },
  ]},
  consonant_set_2: { title:'ㅂ ㅅ ㅇ ㅈ ㅊ', threshold:4, items:[
    { id:'c_b', char:'ㅂ', name:'비읍', type:'CHAR', tts:'비읍', word:'바다', emoji:'🌊' },
    { id:'c_s', char:'ㅅ', name:'시옷', type:'CHAR', tts:'시옷', word:'사자', emoji:'🦁' },
    { id:'c_ng', char:'ㅇ', name:'이응', type:'CHAR', tts:'이응', word:'오리', emoji:'🦆' },
    { id:'c_j', char:'ㅈ', name:'지읒', type:'CHAR', tts:'지읒', word:'자동차', emoji:'🚗' },
    { id:'c_ch', char:'ㅊ', name:'치읓', type:'CHAR', tts:'치읓', word:'치마', emoji:'👗' },
  ]},
  consonant_set_3: { title:'ㅋ ㅌ ㅍ ㅎ', threshold:3, items:[
    { id:'c_k', char:'ㅋ', name:'키읔', type:'CHAR', tts:'키읔', word:'코', emoji:'👃' },
    { id:'c_t', char:'ㅌ', name:'티읕', type:'CHAR', tts:'티읕', word:'토끼', emoji:'🐰' },
    { id:'c_p', char:'ㅍ', name:'피읖', type:'CHAR', tts:'피읖', word:'포도', emoji:'🍇' },
    { id:'c_h', char:'ㅎ', name:'히읗', type:'CHAR', tts:'히읗', word:'하마', emoji:'🦛' },
  ]},
  vowel_set_1: { title:'ㅏ ㅑ ㅓ ㅕ ㅗ', threshold:4, items:[
    { id:'v_a', char:'ㅏ', name:'아', type:'CHAR', tts:'아' },
    { id:'v_ya', char:'ㅑ', name:'야', type:'CHAR', tts:'야' },
    { id:'v_eo', char:'ㅓ', name:'어', type:'CHAR', tts:'어' },
    { id:'v_yeo', char:'ㅕ', name:'여', type:'CHAR', tts:'여' },
    { id:'v_o', char:'ㅗ', name:'오', type:'CHAR', tts:'오' },
  ]},
  vowel_set_2: { title:'ㅛ ㅜ ㅠ ㅡ ㅣ', threshold:4, items:[
    { id:'v_yo', char:'ㅛ', name:'요', type:'CHAR', tts:'요' },
    { id:'v_u', char:'ㅜ', name:'우', type:'CHAR', tts:'우' },
    { id:'v_yu', char:'ㅠ', name:'유', type:'CHAR', tts:'유' },
    { id:'v_eu', char:'ㅡ', name:'으', type:'CHAR', tts:'으' },
    { id:'v_i', char:'ㅣ', name:'이', type:'CHAR', tts:'이' },
  ]},
  syllable_set_ga: { title:'가 나 다 라 마', threshold:4, items:[
    { id:'s_ga', char:'가', name:'가', type:'CHAR', tts:'가' },
    { id:'s_na', char:'나', name:'나', type:'CHAR', tts:'나' },
    { id:'s_da', char:'다', name:'다', type:'CHAR', tts:'다' },
    { id:'s_ra', char:'라', name:'라', type:'CHAR', tts:'라' },
    { id:'s_ma', char:'마', name:'마', type:'CHAR', tts:'마' },
  ]},
  syllable_set_na: { title:'바 사 아 자 차', threshold:4, items:[
    { id:'s_ba', char:'바', name:'바', type:'CHAR', tts:'바' },
    { id:'s_sa', char:'사', name:'사', type:'CHAR', tts:'사' },
    { id:'s_a', char:'아', name:'아', type:'CHAR', tts:'아' },
    { id:'s_ja', char:'자', name:'자', type:'CHAR', tts:'자' },
    { id:'s_cha', char:'차', name:'차', type:'CHAR', tts:'차' },
  ]},
  syllable_set_da: { title:'카 타 파 하', threshold:3, items:[
    { id:'s_ka', char:'카', name:'카', type:'CHAR', tts:'카' },
    { id:'s_ta', char:'타', name:'타', type:'CHAR', tts:'타' },
    { id:'s_pa', char:'파', name:'파', type:'CHAR', tts:'파' },
    { id:'s_ha', char:'하', name:'하', type:'CHAR', tts:'하' },
  ]},
};

// 테마별 단어 (emoji로 그림 표현)
var WORD_THEMES = {
  animals: { title: '🐾 동물 친구들', words: [
    {id:'w_gae', char:'개', name:'개', type:'CHAR', tts:'개', emoji:'🐕'},
    {id:'w_so', char:'소', name:'소', type:'CHAR', tts:'소', emoji:'🐄'},
    {id:'w_mal', char:'말', name:'말', type:'CHAR', tts:'말', emoji:'🐴'},
    {id:'w_sae', char:'새', name:'새', type:'CHAR', tts:'새', emoji:'🐦'},
    {id:'w_gom', char:'곰', name:'곰', type:'CHAR', tts:'곰', emoji:'🐻'},
  ]},
  food: { title: '🍎 맛있는 음식', words: [
    {id:'w_bap', char:'밥', name:'밥', type:'CHAR', tts:'밥', emoji:'🍚'},
    {id:'w_guk', char:'국', name:'국', type:'CHAR', tts:'국', emoji:'🍲'},
    {id:'w_tteok', char:'떡', name:'떡', type:'CHAR', tts:'떡', emoji:'🍡'},
    {id:'w_gam', char:'감', name:'감', type:'CHAR', tts:'감', emoji:'🍊'},
    {id:'w_kong', char:'콩', name:'콩', type:'CHAR', tts:'콩', emoji:'🫘'},
  ]},
  nature: { title: '🌳 자연 속으로', words: [
    {id:'w_san', char:'산', name:'산', type:'CHAR', tts:'산', emoji:'⛰️'},
    {id:'w_mul', char:'물', name:'물', type:'CHAR', tts:'물', emoji:'💧'},
    {id:'w_kkot', char:'꽃', name:'꽃', type:'CHAR', tts:'꽃', emoji:'🌸'},
    {id:'w_dal', char:'달', name:'달', type:'CHAR', tts:'달', emoji:'🌙'},
    {id:'w_byeol', char:'별', name:'별', type:'CHAR', tts:'별', emoji:'⭐'},
  ]},
  body: { title: '🖐️ 우리 몸', words: [
    {id:'w_son', char:'손', name:'손', type:'CHAR', tts:'손', emoji:'✋'},
    {id:'w_nun', char:'눈', name:'눈', type:'CHAR', tts:'눈', emoji:'👁️'},
    {id:'w_gwi', char:'귀', name:'귀', type:'CHAR', tts:'귀', emoji:'👂'},
    {id:'w_ip', char:'입', name:'입', type:'CHAR', tts:'입', emoji:'👄'},
    {id:'w_pal', char:'팔', name:'팔', type:'CHAR', tts:'팔', emoji:'💪'},
  ]},
  family: { title: '👨‍👩‍👧 우리 가족', words: [
    {id:'w_appa', char:'아빠', name:'아빠', type:'CHAR', tts:'아빠', emoji:'👨'},
    {id:'w_eomma', char:'엄마', name:'엄마', type:'CHAR', tts:'엄마', emoji:'👩'},
    {id:'w_nuna', char:'누나', name:'누나', type:'CHAR', tts:'누나', emoji:'👧'},
    {id:'w_hyeong', char:'형', name:'형', type:'CHAR', tts:'형', emoji:'👦'},
    {id:'w_dongsaeng', char:'동생', name:'동생', type:'CHAR', tts:'동생', emoji:'👶'},
  ]},
  vehicles: { title: '🚗 탈것', words: [
    {id:'w_cha', char:'차', name:'차', type:'CHAR', tts:'차', emoji:'🚗'},
    {id:'w_bae', char:'배', name:'배', type:'CHAR', tts:'배', emoji:'🚢'},
    {id:'w_bus', char:'버스', name:'버스', type:'CHAR', tts:'버스', emoji:'🚌'},
    {id:'w_gicha', char:'기차', name:'기차', type:'CHAR', tts:'기차', emoji:'🚂'},
    {id:'w_jahajeon', char:'자전거', name:'자전거', type:'CHAR', tts:'자전거', emoji:'🚲'},
  ]},
};

const STICKERS = ['🐻','🐰','🦊','🐱','🐶','🐸','🦁','🐼','🌟','🌈','🎈','🎀','🍎','🍓','🌻','🦋','🚀','💎','🏆','🎨'];

function getPraise(stars) {
  var n = USER_NAME;
  var msgs = {
    1: [n+'아 잘했어~!', n+'아 좋아좋아~!', n+'아 할 수 있어! 파이팅!', '오오~ '+n+'(이)가 잘 그렸네!'],
    2: [n+'아 멋지다~!', n+'아 잘 썼어! 대박!', n+'아 진짜 대단해~!', '우와앙~ '+n+'아 훌륭해!', n+'아 다람이가 감동했어!'],
    3: [n+'아 참 잘했어~!', n+'아 너무너무 잘한다~!', n+'아 최고야! 짝짝짝!', n+'아 완벽해~! 도토리 백 개!', '우리 '+n+'(이) 천재다~!', n+'아 다람이보다 더 잘해!'],
  };
  var a = msgs[Math.max(1,Math.min(3,stars))];
  return a[Math.random()*a.length|0];
}
function getFailMsg() {
  var n = USER_NAME;
  var msgs = [
    n+'아 다시 한번 써보쟈~!',
    n+'아 괜찮아~ 한 번 더 해보쟈!',
    n+'아 천천히 써봐~ 다람이가 기다릴게!',
    '괜찮아 '+n+'아~ 할 수 있어! 힘내!',
    n+'아 조금만 더 힘내보쟈~! 파이팅!',
  ];
  return msgs[Math.random()*msgs.length|0];
}
