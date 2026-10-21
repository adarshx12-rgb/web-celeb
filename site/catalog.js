(()=>{
const photos = {
  portrait: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  friends: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=700&q=80',
  party: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
  couple: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
  flowers: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
  adventure: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'
};
const templates = [
  {id:'afterhours',name:'Headliner',occasion:'Birthday',recipient:'Him',style:'concert',title:'YOUR NIGHT.<br>YOUR STAGE.',photo:'adventure',note:'Their name in lights. A birthday turned all the way up.',headline:'Tonight belongs to you,',color:'#82e8f5',href:'/concert.html'},
  {id:'confetti',name:'Confetti club',occasion:'Birthday',recipient:'Everyone',style:'party',title:'Another<br>trip around<br>the sun.',photo:'party',note:'A whole lot of life. A whole lot of you.',headline:'Another year of you,',color:'#bcc7f1'},
  {id:'us',name:'Always, us',occasion:'Anniversary',recipient:'Everyone',style:'romance',title:'Of all the<br>people,<br>you.',photo:'couple',note:'My favorite place has always been wherever you are.',headline:'My favorite person,',color:'#e0e7d7'},
  {id:'sunshine',name:'Human sunshine',occasion:'Just because',recipient:'Everyone',style:'sunshine',title:'You make<br>ordinary<br>days good.',photo:'friends',note:'No big occasion. Just a little reminder.',headline:'You make life good,',color:'#f3ed7c'},
  {id:'chapter',name:'Our next chapter',occasion:'Anniversary',recipient:'Everyone',style:'editorial',title:'The best<br>part is us.',photo:'couple',note:'A few of my favorite pages from our little story.',headline:'The best part is you,',color:'#f4f0e7'},
  {id:'heart',name:'With my whole heart',occasion:'Anniversary',recipient:'Her',style:'red',title:'Still<br>you.',photo:'couple',note:'Yesterday, today, and all the tomorrows.',headline:'Still you,',color:'#f7bbd0'},
  {id:'peach',name:'Good as gold',occasion:'Birthday',recipient:'Everyone',style:'peach',title:'Born to<br>be a big<br>deal.',photo:'portrait',note:'The world got a little better the day you arrived.',headline:'Born to be a big deal,',color:'#f4c4a5'},
  {id:'letter',name:'A little love letter',occasion:'Just because',recipient:'Her',style:'loveletter',title:'Dear<br>favorite<br>human.',photo:'flowers',note:"Some things are easier to say in a little letter.",headline:'Dear favorite human,',color:'#f7bbd0'},
  {id:'bloom',name:'In full bloom',occasion:'Birthday',recipient:'Her',style:'romance',title:'Look at<br>you, growing<br>beautifully.',photo:'flowers',note:'A new chapter, with so much good still to come.',headline:'Look at you bloom,',color:'#e0e7d7'},
  {id:'wild',name:'Stay a little wild',occasion:'Birthday',recipient:'Him',style:'sunshine',title:'Older.<br>Bolder.<br>Still you.',photo:'adventure',note:"Here's to more stories we'll never stop telling.",headline:'Stay a little wild,',color:'#f3ed7c'},
  {id:'forever',name:'The everyday kind',occasion:'Anniversary',recipient:'Everyone',style:'loveletter',title:'Love is<br>the little<br>things.',photo:'friends',note:'The coffee. The playlists. The way you make me laugh.',headline:'My everyday favorite,',color:'#f7bbd0'},
  {id:'cheers',name:'Cheers to you',occasion:'Birthday',recipient:'Everyone',style:'red',title:'Life of<br>the party.',photo:'party',note:'A little celebration for a very big personality.',headline:'Cheers to you,',color:'#f4c4a5'},
  {id:'distance',name:'Across the miles',occasion:'Just because',recipient:'Everyone',style:'midnight',title:'Same sky.<br>Still close.',photo:'adventure',note:'A little less distance. A little more you.',headline:'Thinking of you,',color:'#bcc7f1'},
  {id:'moments',name:'All the little moments',occasion:'Anniversary',recipient:'Everyone',style:'editorial',title:'A story<br>worth<br>keeping.',photo:'friends',note:'Every ordinary day with you is one of my favorites.',headline:'A story worth keeping,',color:'#f4f0e7'},
  {id:'hey',name:'Hey, birthday person',occasion:'Birthday',recipient:'Everyone',style:'peach',title:'So glad<br>you<br>exist.',photo:'portrait',note:"Here's to more life, more laughs, and more of you.",headline:'So glad you exist,',color:'#f7bbd0'}
];
const palettes=[{name:'Rose',color:'#f7bbd0'},{name:'Sage',color:'#e0e7d7'},{name:'Lilac',color:'#bcc7f1'},{name:'Sunshine',color:'#f3ed7c'},{name:'Peach',color:'#f4c4a5'}];
window.CelebrationCatalog={photos,templates,palettes};
})();
