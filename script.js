(function(){
  "use strict";
  const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a,b,t) => a + (b-a)*t;
  const clamp = (v,a,b) => Math.min(b, Math.max(a,v));

  /* ==========================================================
     1. NAVBAR, PROGRESSO, REVELAÇÕES
     ========================================================== */
  const nav = document.getElementById("nav");
  const menu = document.getElementById("menu");
  const hamb = document.getElementById("hamburguer");
  const barra = document.getElementById("progresso");
  const flutuante = document.getElementById("flutuante");
  const pauta = document.getElementById("pauta");
  document.getElementById("ano").textContent = new Date().getFullYear();

  hamb.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    hamb.setAttribute("aria-expanded", String(aberto));
    hamb.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });
  menu.addEventListener("click", e => {
    if(e.target.tagName === "A"){
      menu.classList.remove("aberto");
      hamb.setAttribute("aria-expanded","false");
    }
  });

  let alvoScroll = 0, scrollSuave = 0;
  function medirScroll(){
    alvoScroll = window.scrollY || document.documentElement.scrollTop;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.width = (total > 0 ? (alvoScroll/total)*100 : 0) + "%";
    nav.classList.toggle("solida", alvoScroll > 60);
    flutuante.classList.toggle("visivel", alvoScroll > window.innerHeight * 0.85);
  }
  window.addEventListener("scroll", medirScroll, {passive:true});
  medirScroll();

  // link ativo
  const secoes = [...document.querySelectorAll("section[id]")];
  const links = [...menu.querySelectorAll("a")];
  const obsNav = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if(e.isIntersecting){
        links.forEach(a => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, {rootMargin:"-45% 0px -50% 0px"});
  secoes.forEach(s => obsNav.observe(s));

  // revelações
  const obsRevela = new IntersectionObserver(entradas => {
    entradas.forEach(e => { if(e.isIntersecting){ e.target.classList.add("visivel"); obsRevela.unobserve(e.target); } });
  }, {threshold:.16, rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".revela").forEach(el => obsRevela.observe(el));

  /* ==========================================================
     2. CARTÕES 3D COM INCLINAÇÃO (planos)
     ========================================================== */
  if(!menosMovimento && window.matchMedia("(hover:hover)").matches){
    document.querySelectorAll(".plano").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
        card.style.setProperty("--mx", (px*100)+"%");
        card.style.setProperty("--my", (py*100)+"%");
        card.style.transform = `rotateY(${(px-.5)*11}deg) rotateX(${(.5-py)*11}deg) translateZ(18px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ==========================================================
     3. CARROSSEL COVERFLOW 3D — com vídeo real
     ========================================================== */
  const trilho = document.getElementById("trilho");
  const slides = [...trilho.querySelectorAll(".slide")];
  const pontos = document.getElementById("pontos");
  let atual = 0;

  function pausarTodos(exceto){
    slides.forEach(s => {
      if(s === exceto) return;
      const v = s.querySelector(".slide__video");
      if(v && !v.paused) v.pause();
    });
  }

  slides.forEach((s,i) => {
    const b = document.createElement("button");
    b.className = "ponto"; b.type = "button";
    b.setAttribute("aria-label", "Ir para o vídeo " + (i+1));
    b.addEventListener("click", () => irPara(i));
    pontos.appendChild(b);

    const video = s.querySelector(".slide__video");
    const duracao = s.querySelector(".slide__dur");

    s.addEventListener("click", () => {
      if(i !== atual){ irPara(i); return; }
      if(!video) return;
      if(video.paused){
        pausarTodos(s);
        video.play().catch(() => {
          // sem arquivo de vídeo ainda em videos/ — nada a fazer, a capa continua visível
        });
      } else {
        video.pause();
      }
    });

    if(video){
      video.addEventListener("play",  () => s.classList.add("tocando"));
      video.addEventListener("pause", () => s.classList.remove("tocando"));
      video.addEventListener("ended", () => s.classList.remove("tocando"));
      video.addEventListener("loadedmetadata", () => {
        if(duracao && isFinite(video.duration)){
          const total = Math.round(video.duration);
          const m = Math.floor(total/60), sgs = String(total%60).padStart(2,"0");
          duracao.textContent = `${m}:${sgs}`;
        }
      });
    }
  });

  function irPara(i){
    atual = (i + slides.length) % slides.length;
    pausarTodos(slides[atual]);
    desenharCarrossel();
  }
  function desenharCarrossel(){
    const estreito = window.innerWidth < 760;
    const desloc = estreito ? 175 : 300;
    const prof = estreito ? 190 : 260;
    slides.forEach((s,i) => {
      let d = i - atual;
      if(d > slides.length/2) d -= slides.length;
      if(d < -slides.length/2) d += slides.length;
      const abs = Math.abs(d);
      s.style.transform =
        `translate(-50%,-50%) translateX(${d*desloc}px) translateZ(${-abs*prof}px) rotateY(${d*-34}deg) scale(${1 - abs*0.06})`;
      s.style.opacity = abs > 2 ? 0 : (1 - abs*0.26);
      s.style.filter = `brightness(${1 - abs*0.3}) saturate(${1 - abs*0.25})`;
      s.style.zIndex = String(50 - abs);
      s.style.pointerEvents = abs > 2 ? "none" : "auto";
      s.setAttribute("aria-hidden", abs > 2 ? "true" : "false");
    });
    [...pontos.children].forEach((p,i) => p.classList.toggle("ativo", i === atual));
  }
  document.getElementById("proximo").addEventListener("click", () => irPara(atual+1));
  document.getElementById("anterior").addEventListener("click", () => irPara(atual-1));
  window.addEventListener("keydown", e => {
    if(e.key === "ArrowRight") irPara(atual+1);
    if(e.key === "ArrowLeft") irPara(atual-1);
  });
  // arrastar
  let x0 = null;
  trilho.addEventListener("pointerdown", e => { x0 = e.clientX; });
  trilho.addEventListener("pointerup", e => {
    if(x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if(Math.abs(dx) > 55) irPara(atual + (dx < 0 ? 1 : -1));
  });
  window.addEventListener("resize", desenharCarrossel);
  desenharCarrossel();


  /* ==========================================================
     4. FORMULÁRIO → HYPERLINK PARA O WHATSAPP
     O botão "enviar" agora é um <a>: o href é recalculado a cada
     campo digitado, então ele já é um link válido para o WhatsApp
     mesmo sem clicar — clique direito → abrir em nova aba também funciona.
     ========================================================== */
  const TELEFONE = "5544999027819"; // ← troque pelo número real (55 + DDD + número)
  const aviso = document.getElementById("aviso");
  const linkEnviar = document.getElementById("enviar");
  const camposForm = ["f-nome","f-data","f-local","f-tipo","f-msg"].map(id => document.getElementById(id));

  document.querySelectorAll("[data-plano]").forEach(a => {
    a.addEventListener("click", () => {
      document.getElementById("f-tipo").value = a.dataset.plano;
      atualizarLink();
    });
  });

  function atualizarLink(){
    const nome = document.getElementById("f-nome").value.trim();
    const data = document.getElementById("f-data").value;
    const local = document.getElementById("f-local").value.trim();
    const tipo = document.getElementById("f-tipo").value;
    const msg = document.getElementById("f-msg").value.trim();
    const dataBR = data ? data.split("-").reverse().join("/") : "a combinar";

    const texto =
      `Olá, Lucas! Sou ${nome || "(seu nome)"}.\n` +
      `Data: ${dataBR}\nLocal: ${local || "(cidade e local)"}\nFormato: ${tipo}\n` +
      (msg ? `Música em mente: ${msg}\n` : "") +
      `Essa data está livre?`;

    linkEnviar.href = "https://wa.me/5544999027819?text=" + encodeURIComponent(texto);
    return {nome, data, local};
  }

  camposForm.forEach(campo => {
    campo.addEventListener("input", atualizarLink);
    campo.addEventListener("change", atualizarLink);
  });
  atualizarLink(); // deixa o link já válido assim que a página carrega

  linkEnviar.addEventListener("click", (e) => {
    const {nome, data, local} = atualizarLink();
    if(!nome || !data || !local){
      e.preventDefault();
      aviso.dataset.estado = "erro";
      aviso.textContent = "Faltou nome, data ou local. Preencha os três e eu consigo responder com o valor certo.";
      return;
    }
    aviso.dataset.estado = "";
    aviso.textContent = "Abrindo o WhatsApp com sua mensagem pronta…";
  });

  /* ==========================================================
     5. PALCO 3D — CASIO CT-X5000 VOADOR
     ========================================================== */
  const canvas = document.getElementById("palco3d");
  if(typeof THREE === "undefined" || !canvas) return;

  // telas pequenas ou processadores fracos: cena mais leve
  const leve = window.innerWidth < 820 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({canvas, antialias:!leve, alpha:true, powerPreference:"high-performance"});
  }catch(err){ return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, leve ? 1.15 : 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  const cena = new THREE.Scene();
  cena.fog = new THREE.FogExp2(0x05030a, 0.022);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.1, 260);
  camera.position.set(0, 0, 26);

  // --- luzes ---
  cena.add(new THREE.AmbientLight(0x4a2f80, 0.55));
  const luzChave = new THREE.DirectionalLight(0xffffff, 1.05);
  luzChave.position.set(6, 10, 9); cena.add(luzChave);
  const luzRoxa = new THREE.PointLight(0x8b5cf6, 2.6, 70); luzRoxa.position.set(-11, 5, 10); cena.add(luzRoxa);
  const luzVeludo = new THREE.PointLight(0x4c1d95, 2.2, 70); luzVeludo.position.set(12, -6, 6); cena.add(luzVeludo);
  const luzContra = new THREE.SpotLight(0xffffff, 1.5, 90, 0.7, 0.6); luzContra.position.set(0, 4, -20); cena.add(luzContra);

  // --- materiais ---
  const matCorpo = new THREE.MeshStandardMaterial({color:0x121018, roughness:0.42, metalness:0.72});
  const matCorpoTopo = new THREE.MeshStandardMaterial({color:0x1b1426, roughness:0.35, metalness:0.8});
  const matBranca = new THREE.MeshStandardMaterial({color:0xf4f1f7, roughness:0.32, metalness:0.06});
  const matPreta = new THREE.MeshStandardMaterial({color:0x08050f, roughness:0.26, metalness:0.45});
  const matRoxo = new THREE.MeshStandardMaterial({color:0x6d28d9, roughness:0.3, metalness:0.6, emissive:0x4c1d95, emissiveIntensity:0.85});

  /* textura do painel gerada em canvas (sem arquivos externos) */
  function texturaPainel(){
    const c = document.createElement("canvas");
    c.width = 2048; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#151020"; g.fillRect(0,0,c.width,c.height);

    // ranhuras
    g.strokeStyle = "rgba(255,255,255,.035)";
    for(let x=0; x<c.width; x+=6){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,c.height); g.stroke(); }

    // grades dos alto-falantes
    function grade(cx){
      for(let r=10; r<86; r+=9){
        g.beginPath(); g.arc(cx, 128, r, 0, Math.PI*2);
        g.strokeStyle = "rgba(168,85,247,.16)"; g.lineWidth = 2; g.stroke();
      }
    }
    grade(200); grade(c.width-200);

    // visor
    g.fillStyle = "#2a0a45"; g.fillRect(880, 66, 300, 124);
    g.strokeStyle = "#a855f7"; g.lineWidth = 3; g.strokeRect(880, 66, 300, 124);
    g.fillStyle = "#c4b5fd"; g.font = "600 40px Georgia, serif";
    g.fillText("001 GrandPno", 900, 118);
    g.font = "300 26px Georgia, serif"; g.fillStyle = "#a855f7";
    g.fillText("TEMPO 72", 900, 162);

    // logo
    g.fillStyle = "#f4f1f7"; g.font = "700 54px Georgia, serif";
    g.fillText("CASIO", 420, 120);
    g.fillStyle = "#a855f7"; g.font = "300 30px Georgia, serif";
    g.fillText("CT-X5000", 420, 166);

    // botõezinhos
    for(let i=0;i<16;i++){
      g.fillStyle = i%4===0 ? "rgba(168,85,247,.85)" : "rgba(244,241,247,.22)";
      g.fillRect(1280 + i*34, 92, 22, 22);
      g.fillRect(1280 + i*34, 140, 22, 22);
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  /* --- construção do teclado --- */
  const teclado = new THREE.Group();
  const OITAVAS = 5, BRANCAS_OIT = 7;
  const LB = 0.92, GAP = 0.05, COMP_B = 5.6, ALT_B = 0.52;
  const totalBrancas = OITAVAS*BRANCAS_OIT + 1; // 36 teclas brancas
  const largura = totalBrancas*(LB+GAP);

  const geoBranca = new THREE.BoxGeometry(LB, ALT_B, COMP_B);
  const geoPreta  = new THREE.BoxGeometry(LB*0.58, ALT_B*1.5, COMP_B*0.62);
  const teclas = [];
  const pretasApos = [0,1,3,4,5];

  for(let i=0; i<totalBrancas; i++){
    const x = -largura/2 + i*(LB+GAP) + LB/2;
    const k = new THREE.Mesh(geoBranca, matBranca.clone());
    k.position.set(x, 0, COMP_B/2 + 0.2);
    teclado.add(k); teclas.push(k);

    const grau = i % BRANCAS_OIT;
    if(pretasApos.includes(grau) && i < totalBrancas-1){
      const p = new THREE.Mesh(geoPreta, matPreta.clone());
      p.position.set(x + (LB+GAP)/2, ALT_B*0.52, COMP_B/2 - 0.85);
      teclado.add(p); teclas.push(p);
    }
  }

  // corpo
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(largura+1.5, 1.55, 9.6), matCorpo);
  corpo.position.set(0, -0.55, 0.9);
  teclado.add(corpo);

  // painel superior com textura
  const painel = new THREE.Mesh(
    new THREE.PlaneGeometry(largura+1.1, 3.4),
    new THREE.MeshStandardMaterial({map:texturaPainel(), roughness:0.5, metalness:0.45})
  );
  painel.rotation.x = -Math.PI/2;
  painel.position.set(0, 0.24, -1.9);
  teclado.add(painel);

  // faixa luminosa roxa (a assinatura visual)
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(largura+1.52, 0.1, 0.32), matRoxo);
  faixa.position.set(0, 0.12, 5.72);
  teclado.add(faixa);
  const faixaTras = faixa.clone(); faixaTras.position.z = -3.9; teclado.add(faixaTras);

  // knobs e botões físicos
  const geoKnob = new THREE.CylinderGeometry(0.26, 0.3, 0.34, 20);
  for(let i=0;i<6;i++){
    const kn = new THREE.Mesh(geoKnob, i%2 ? matRoxo : matCorpoTopo);
    kn.position.set(-largura/2 + 3 + i*1.5, 0.42, -3.0);
    teclado.add(kn);
  }
  // visor em relevo
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.12, 1.5),
    new THREE.MeshStandardMaterial({color:0x2a0a45, emissive:0x6d28d9, emissiveIntensity:1.1, roughness:.25})
  );
  visor.position.set(1.4, 0.32, -2.2);
  teclado.add(visor);

  // estante de partitura translúcida
  const estante = new THREE.Mesh(
    new THREE.PlaneGeometry(largura*0.42, 4.4),
    new THREE.MeshStandardMaterial({color:0xa855f7, transparent:true, opacity:0.13, side:THREE.DoubleSide, roughness:.1, metalness:.4})
  );
  estante.position.set(0, 2.1, -4.4);
  estante.rotation.x = -0.28;
  teclado.add(estante);

  teclado.scale.setScalar(0.62);
  cena.add(teclado);

  // cor emissiva das teclas é fixada uma única vez aqui —
  // no laço de animação só a intensidade muda, o que é bem mais barato
  teclas.forEach(t => t.material.emissive && t.material.emissive.setHex(0x6d28d9));

  // aro orbital
  const aro = new THREE.Mesh(
    new THREE.TorusGeometry(15, 0.045, 6, leve ? 64 : 120),
    new THREE.MeshBasicMaterial({color:0x8b5cf6, transparent:true, opacity:0.4})
  );
  aro.rotation.x = Math.PI/2.1;
  cena.add(aro);
  const aro2 = aro.clone(); aro2.scale.setScalar(1.3); aro2.rotation.z = 0.7;
  aro2.material = new THREE.MeshBasicMaterial({color:0x4c1d95, transparent:true, opacity:0.3});
  cena.add(aro2);

  // poeira estelar
  const qtd = leve ? 260 : 550;
  const posicoes = new Float32Array(qtd*3);
  for(let i=0;i<qtd;i++){
    posicoes[i*3]   = (Math.random()-0.5)*100;
    posicoes[i*3+1] = (Math.random()-0.5)*70;
    posicoes[i*3+2] = (Math.random()-0.5)*80 - 12;
  }
  const geoPo = new THREE.BufferGeometry();
  geoPo.setAttribute("position", new THREE.BufferAttribute(posicoes, 3));
  const po = new THREE.Points(geoPo, new THREE.PointsMaterial({color:0xc4b5fd, size:0.12, transparent:true, opacity:0.55, sizeAttenuation:true}));
  cena.add(po);

  // notas musicais flutuantes (sprites desenhados em canvas)
  function spriteNota(glifo){
    const c = document.createElement("canvas"); c.width = c.height = 96;
    const g = c.getContext("2d");
    g.fillStyle = "#c4b5fd"; g.font = "72px Georgia, serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(glifo, 48, 50);
    return new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c), transparent:true, opacity:0.55, depthWrite:false});
  }
  const glifos = ["♪","♫","♩","𝄞"];
  const notas = [];
  const qtdNotas = leve ? 8 : 16;
  for(let i=0;i<qtdNotas;i++){
    const s = new THREE.Sprite(spriteNota(glifos[i % glifos.length]));
    s.position.set((Math.random()-0.5)*54, (Math.random()-0.5)*34, (Math.random()-0.5)*34 - 8);
    s.scale.setScalar(1.1 + Math.random()*1.5);
    s.userData = {vy: 0.006 + Math.random()*0.014, giro: Math.random()*Math.PI*2};
    notas.push(s); cena.add(s);
  }

  /* --- coreografia por seção --- */
  const poses = [
    {pos:[0.2,-1.4,2],    rot:[-0.42, 0.55, 0.06], esc:0.70, cam:26},  // hero
    {pos:[-5.4,1.6,-2],   rot:[-0.16,-0.75,-0.16], esc:0.56, cam:28},  // história
    {pos:[5.6,-0.6,-3],   rot:[-0.62, 0.95, 0.22], esc:0.52, cam:30},  // contrate
    {pos:[0,3.4,-9],      rot:[-1.32, 0.10, 0.00], esc:0.62, cam:27},  // portfólio (de cima)
    {pos:[-4.2,-2.6,-1],  rot:[ 0.30,-0.50, 0.30], esc:0.50, cam:29},  // feedbacks
    {pos:[0,0.4,3],       rot:[-0.30, 0.00, 0.00], esc:0.74, cam:24}   // final
  ];
  const atualPose = {px:0,py:0,pz:0, rx:0,ry:0,rz:0, esc:0.7, cam:26};
  let mouseX = 0, mouseY = 0, alvoMX = 0, alvoMY = 0;

  window.addEventListener("pointermove", e => {
    alvoMX = (e.clientX/window.innerWidth - 0.5);
    alvoMY = (e.clientY/window.innerHeight - 0.5);
  }, {passive:true});

  function poseDoScroll(){
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = clamp(scrollSuave/total, 0, 1) * (poses.length - 1);
    const i = Math.min(poses.length-2, Math.floor(p));
    const t = p - i;
    const s = t*t*(3-2*t); // suavização
    const a = poses[i], b = poses[i+1];
    return {
      px: lerp(a.pos[0], b.pos[0], s), py: lerp(a.pos[1], b.pos[1], s), pz: lerp(a.pos[2], b.pos[2], s),
      rx: lerp(a.rot[0], b.rot[0], s), ry: lerp(a.rot[1], b.rot[1], s), rz: lerp(a.rot[2], b.rot[2], s),
      esc: lerp(a.esc, b.esc, s), cam: lerp(a.cam, b.cam, s)
    };
  }

  let ativo = true, relogio = new THREE.Clock();
  document.addEventListener("visibilitychange", () => { ativo = !document.hidden; if(ativo) relogio.getDelta(); });

  // em telas/processadores leves, limita a ~30 quadros por segundo:
  // metade do trabalho de CPU/GPU, sem diferença perceptível numa cena de fundo
  const intervaloMinimo = leve ? 1000/30 : 0;
  let ultimoQuadro = 0;

  function animar(agora){
    requestAnimationFrame(animar);
    if(!ativo) return;
    if(intervaloMinimo && agora - ultimoQuadro < intervaloMinimo) return;
    ultimoQuadro = agora;
    const dt = Math.min(relogio.getDelta(), 0.05);
    const tempo = relogio.elapsedTime;

    scrollSuave = lerp(scrollSuave, alvoScroll, menosMovimento ? 1 : 0.085);
    mouseX = lerp(mouseX, alvoMX, 0.06);
    mouseY = lerp(mouseY, alvoMY, 0.06);

    const alvo = poseDoScroll();
    const k = menosMovimento ? 1 : 0.06;
    atualPose.px = lerp(atualPose.px, alvo.px, k);
    atualPose.py = lerp(atualPose.py, alvo.py, k);
    atualPose.pz = lerp(atualPose.pz, alvo.pz, k);
    atualPose.rx = lerp(atualPose.rx, alvo.rx, k);
    atualPose.ry = lerp(atualPose.ry, alvo.ry, k);
    atualPose.rz = lerp(atualPose.rz, alvo.rz, k);
    atualPose.esc = lerp(atualPose.esc, alvo.esc, k);
    atualPose.cam = lerp(atualPose.cam, alvo.cam, k);

    const flutua = menosMovimento ? 0 : Math.sin(tempo*0.62)*0.55;
    const balanca = menosMovimento ? 0 : Math.sin(tempo*0.45)*0.05;

    teclado.position.set(atualPose.px + mouseX*2.4, atualPose.py + flutua - mouseY*1.2, atualPose.pz);
    teclado.rotation.set(atualPose.rx + mouseY*0.18, atualPose.ry + mouseX*0.5 + balanca, atualPose.rz + balanca*0.5);
    teclado.scale.setScalar(atualPose.esc);
    camera.position.z = atualPose.cam;

    // teclas tocando sozinhas — em telas leves, anima só a metade das teclas
    if(!menosMovimento){
      const passo = leve ? 2 : 1;
      for(let i=0;i<teclas.length;i+=passo){
        const fase = Math.sin(tempo*2.1 + i*0.55);
        const pressiona = fase > 0.94 ? -0.16 : 0;
        teclas[i].rotation.x = lerp(teclas[i].rotation.x, pressiona, 0.16);
        const m = teclas[i].material;
        m.emissiveIntensity = lerp(m.emissiveIntensity || 0, fase > 0.94 ? 0.75 : 0, 0.14);
      }
    }

    // aros e poeira
    aro.rotation.z += dt*0.08; aro2.rotation.z -= dt*0.05; aro2.rotation.x += dt*0.02;
    po.rotation.y += dt*0.012;

    // notas subindo
    for(const n of notas){
      n.position.y += n.userData.vy;
      n.material.opacity = 0.2 + Math.abs(Math.sin(tempo*0.6 + n.userData.giro))*0.4;
      if(n.position.y > 20) n.position.y = -20;
    }

    // luzes pulsando no compasso
    luzRoxa.intensity = 2.2 + Math.sin(tempo*1.4)*0.7;
    luzVeludo.intensity = 1.9 + Math.cos(tempo*1.1)*0.6;

    renderer.render(cena, camera);
  }

  function redimensionar(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  }
  window.addEventListener("resize", redimensionar);

  animar();
  requestAnimationFrame(() => canvas.classList.add("pronto"));

  // parallax leve na pauta de fundo
  if(!menosMovimento){
    window.addEventListener("scroll", () => {
      pauta.style.transform = `rotate(-8deg) translateY(${alvoScroll * -0.05}px)`;
    }, {passive:true});
  }
})();
