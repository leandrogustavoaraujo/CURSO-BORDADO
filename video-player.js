/* Official YouTube API, requested only after an explicit user click. */
(()=>{'use strict';
let apiPromise=null,player=null,generation=0;
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const errorText={2:'O endereço do vídeo não foi aceito pelo YouTube.',5:'O navegador não conseguiu reproduzir este vídeo.',100:'Este vídeo foi removido ou ficou privado.',101:'O criador não permite a reprodução incorporada deste vídeo.',150:'O criador não permite a reprodução incorporada deste vídeo.',153:'O YouTube não identificou a origem desta página. Abra o curso por HTTP ou HTTPS, ou use o link para o original.'};
function clean(){generation++;try{player?.destroy()}catch(e){}player=null}
function loadAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')previous();resolve(window.YT)};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';
  script.onerror=()=>{apiPromise=null;script.remove();reject(new Error('O YouTube não carregou. Confira sua conexão ou abra o original.'))};document.head.append(script);
  setTimeout(()=>{if(!window.YT?.Player){apiPromise=null;script.remove();reject(new Error('O YouTube está demorando para responder. Você pode tentar novamente ou abrir o original.'))}},12000);
 });return apiPromise;
}
function html(v){
 if(!v)return '<div class="notice"><b>Vídeo desta aula ainda necessário.</b> O conteúdo escrito e o exercício estão disponíveis. Ainda não há um vídeo pertinente selecionado para esta aula.</div>';
 return `<section class="resource video-resource" aria-label="Vídeo de apoio"><span class="eyebrow">ASSISTA E PRATIQUE</span><h3>${escape(v.title)}</h3><p class="video-credit">Por ${v.author_url?`<a href="${escape(v.author_url)}" target="_blank" rel="noopener noreferrer">${escape(v.author)}</a>`:escape(v.author)}</p><div class="video-stage" data-player-stage="${escape(v.id)}"><button type="button" class="video-launch" data-video-play="${escape(v.id)}" aria-label="Assistir nesta aula: ${escape(v.title)}"><span class="play-disc" aria-hidden="true"><span></span></span><strong>Assistir nesta aula</strong><small>O vídeo carrega somente quando você clicar</small></button></div><p class="video-status" role="status" data-video-status>Player oficial do YouTube · controles e tela cheia disponíveis</p><p>${escape(v.coverage)}.</p>${v.note?`<p class="video-note">${escape(v.note)}</p>`:''}<div class="actions"><a class="button secondary" href="${escape(v.url)}" target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗</a><button type="button" class="video-retry secondary" data-video-play="${escape(v.id)}" hidden>Tentar carregar novamente</button></div><details class="video-disclosure"><summary>Créditos, privacidade e disponibilidade</summary><p>Vídeo externo do canal creditado acima, sem download ou reenvio. Não é uma gravação de Fernanda Alencar. Ao clicar, seu navegador se conecta ao YouTube; a reprodução segue as regras e a disponibilidade do serviço. Metadados consultados via oEmbed oficial; áudio e conteúdo integral não foram revisados. Disponibilidade de iframe não equivale a autorização para comercializar a aula como própria.</p></details></section>`;
}
document.addEventListener('click',async event=>{
 if(event.target.closest('#complete')){clean();return}
 const button=event.target.closest('[data-video-play]');if(!button)return;
 const resource=button.closest('.video-resource'),stage=resource?.querySelector('[data-player-stage]'),status=resource?.querySelector('[data-video-status]');
 const video=window.ALENCAR_DATA?.lessons.find(l=>l.video?.id===button.dataset.videoPlay)?.video;
 if(!video||!stage)return;
 clean();const ticket=generation;const retry=resource.querySelector('.video-retry');retry.hidden=true;
 button.disabled=true;status.textContent='Carregando o player oficial…';
 try{
  const YT=await loadAPI();if(ticket!==generation||!stage.isConnected)return;
  const mount=document.createElement('div');mount.id='alencar-youtube-player';stage.replaceChildren(mount);
  const vars={playsinline:1,rel:0,controls:1};if(/^https?:$/.test(location.protocol))vars.origin=location.origin;
  player=new YT.Player(mount,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',videoId:video.id,playerVars:vars,events:{
   onReady:e=>{if(ticket!==generation)return;status.textContent='Vídeo pronto. Use os controles do YouTube para assistir.';e.target.getIframe().setAttribute('referrerpolicy','strict-origin-when-cross-origin');e.target.playVideo()},
   onStateChange:e=>{if(ticket!==generation)return;if(e.data===1)status.textContent='Reproduzindo nesta aula.';else if(e.data===0)status.textContent='Vídeo finalizado. Faça o exercício e confira seu resultado.';else if(e.data===2)status.textContent='Vídeo pausado.'},
   onAutoplayBlocked:()=>{if(ticket===generation)status.textContent='Player pronto. Toque no play do YouTube para iniciar.'},
   onError:e=>{if(ticket!==generation)return;status.textContent=(errorText[e.data]||'O vídeo não pôde ser reproduzido neste navegador.')+' O link Abrir no YouTube continua disponível.';retry.hidden=false}
  }});
 }catch(e){if(ticket===generation&&stage.isConnected){status.textContent=e.message;button.disabled=false;retry.hidden=false}}
});
window.addEventListener('hashchange',clean);
window.AlencarVideo={html,clean};
})();
