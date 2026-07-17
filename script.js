let activeSpells = [];
    let rotation = [];
    let currentHuntStyle = 'Area'; 
    let currentLevel = 200;
    let suggestedCombo = [];

    // Banco de dados tático de porquês e explicações de magias do Tibia/Monk
    const spellCommentaries = {
        "virtue of harmony": "Ative sempre no início! Ele aumenta sua Harmonia base e reembolsa pontos ao usar magias gastadoras, mantendo o combo fluido.",
        "virtue of justice": "Excelente buff de abertura. Aumenta seu Fist Fighting em até 16% e melhora os atributos do seu time.",
        "virtue of sustain": "Use defensivamente. Ela aumenta toda a sua cura de monge em até 70% quando você está no estado sereno.",
        "chained penance": "Seu principal ataque gerador em cadeia. Atinge até 6 alvos à distância, perfeito para juntar Harmonia sem risco.",
        "greater flurry of blows": "Seu gerador em área mais forte. Use logo após colar na box para encher sua barra de Harmonia.",
        "flurry of blows": "Gerador de área básico. Use para cobrir turnos de recarga e somar mais pontos de Harmonia.",
        "double jab": "Ataque rápido de alvo único com quase zero cooldown. Ideal contra bosses ou para finalizar criaturas isoladas.",
        "forceful uppercut": "Ataque focado com dano massivo. Excelente para focar o monstro mais perigoso da box.",
        "sweeping takedown": "O melhor gastador (Spender) em área! Consome toda a Harmonia acumulada para varrer o leque de monstros à sua frente.",
        "spiritual outburst": "Finalizador supremo de área. Causa uma explosão de dano em cadeia em 2 turnos consecutivos.",
        "devastating knockout": "O maior dano bruto contra alvo único. Use contra bosses para descarregar toda a sua Harmonia de uma vez.",
        "tiger clash": "Finalizador básico. Perfeito no early game para gastar a Harmonia acumulada contra monstros isolados."
    };

    function showNotification(message, type = 'success') {
        const banner = document.getElementById('notificationBanner');
        banner.innerHTML = `<i class="${type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'} mr-2"></i> ${message}`;
        banner.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 font-bold border ${
            type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800' 
            : 'bg-rose-950/90 text-rose-400 border-rose-800'
        }`;
        banner.classList.remove('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => {
            banner.classList.add('opacity-0', 'translate-y-[-20px]');
        }, 4000);
    }

    // Classifica dinamicamente qualquer magia coletada da Wiki baseado em heurísticas
    function getSpellClassification(spell, voc) {
        const name = spell.name.toLowerCase();
        const words = spell.words.toLowerCase();
        const vocL = voc.toLowerCase();

        let category = "Ataque";
        let targetType = "Alvo Único";
        let color = "rose"; 
        let badgeIcon = "fa-bullseye";
        let roleExplanation = "Foco em causar dano consistente em uma única criatura.";

        // Exclui magias que removem condições (veneno, queimação, etc.) do Healing
        const nameL = name.toLowerCase();
        const wordsL = words.toLowerCase();
        const isConditionCure = wordsL.startsWith('exana') || 
                               nameL.includes('poison') || 
                               nameL.includes('burning') || 
                               nameL.includes('curse') || 
                               nameL.includes('bleed') || 
                               nameL.includes('electr');

        if (isConditionCure) {
            category = "Suporte / Buff";
            color = "amber";
            targetType = "Utilitário";
            badgeIcon = "fa-shield-halved";
            roleExplanation = "Remove condições de status prejudiciais (veneno, queimação, maldição).";
            return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
        }

        // Se a Wiki diz explicitamente que é suporte/cura, respeita isso primeiro!
        if (spell.wikiType) {
            const wt = spell.wikiType.toLowerCase().trim();
            if (wt.includes('suporte') || wt.includes('support') || wt.includes('buff') || wt.includes('util')) {
                category = "Suporte / Buff";
                color = "amber";
                targetType = "Utilitário";
                badgeIcon = "fa-shield-halved";
                roleExplanation = "Aumenta seus atributos, velocidade ou fornece buffs táticos indispensáveis antes do combate.";
                return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
            }
            if (wt.includes('cura') || wt.includes('heal') || wt.includes('healing')) {
                category = "Cura";
                color = "teal";
                badgeIcon = "fa-heart";
                const isFriendHeal = name.includes('sio') || name.includes('friend') || name.includes('restore balance') || words.includes('sio');
                if (isFriendHeal) {
                    targetType = "Heal Amigo";
                    roleExplanation = "Cura um jogador aliado selecionado (semelhante ao Sio).";
                } else if (name.includes('mass') || name.includes('res') || words.includes('mas')) {
                    targetType = "Cura em Área";
                    roleExplanation = "Restaura a vida do usuário e de todos os aliados e summons próximos.";
                } else {
                    targetType = "Cura Individual";
                    roleExplanation = "Magia de sobrevivência rápida para recuperar sua própria vida.";
                }
                return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
            }
        }

        if (words.startsWith('exura') || name.includes('heal') || name.includes('mend') || name.includes('cure') || name.includes('recovery')) {
            category = "Cura";
            color = "teal";
            badgeIcon = "fa-heart";
            const isFriendHeal = name.includes('sio') || name.includes('friend') || name.includes('restore balance') || words.includes('sio');
            if (isFriendHeal) {
                targetType = "Heal Amigo";
                roleExplanation = "Cura um jogador aliado selecionado (semelhante ao Sio).";
            } else if (name.includes('mass') || name.includes('res') || words.includes('mas')) {
                targetType = "Cura em Área";
                roleExplanation = "Restaura a vida do usuário e de todos os aliados e summons próximos.";
            } else {
                targetType = "Cura Individual";
                roleExplanation = "Magia de sobrevivência rápida para recuperar sua própria vida.";
            }
            return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
        }

        if (words.startsWith('utito') || words.startsWith('utani') || words.startsWith('utamo') || name.includes('virtue') || name.includes('haste') || name.includes('focus') || name.includes('party')) {
            category = "Suporte / Buff";
            color = "amber";
            targetType = "Utilitário";
            badgeIcon = "fa-shield-halved";
            roleExplanation = "Aumenta seus atributos, velocidade ou fornece buffs táticos indispensáveis antes do combate.";
            return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
        }

        if (vocL.includes('monk')) {
            const builders = ["chained penance", "greater flurry of blows", "flurry of blows", "thousand fist blows", "double jab", "forceful uppercut", "mystic repulse", "lesser mystic repulse", "swift jab"];
            const spenders = ["sweeping takedown", "spiritual outburst", "greater tiger clash", "devastating knockout", "tiger clash"];
            const aoes = ["chained penance", "greater flurry of blows", "flurry of blows", "sweeping takedown", "spiritual outburst"];

            if (builders.includes(name)) {
                category = "Gerador (Builder)";
                color = "emerald";
                badgeIcon = "fa-battery-three-quarters";
                targetType = aoes.includes(name) ? "Dano em Área" : "Alvo Único";
                roleExplanation = `Ataque do tipo Gerador. Causa dano e **acumula Harmonia** na sua barra de recursos.`;
            } else if (spenders.includes(name)) {
                category = "Gastador (Spender)";
                color = "rose";
                badgeIcon = "fa-bolt";
                targetType = aoes.includes(name) ? "Dano em Área" : "Alvo Único";
                roleExplanation = `Ataque do tipo Gastador. Consome sua Harmonia acumulada para descarregar um **dano devastador**!`;
            }
            return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
        }

        const aoeKeywords = ["exevo", "mas", "berserk", "shaker", "storm", "aval", "wave", "fury", "sweep"];
        const isAoe = aoeKeywords.some(keyword => name.includes(keyword) || words.includes(keyword));

        if (isAoe) {
            targetType = "Dano em Área";
            badgeIcon = "fa-burst";
            roleExplanation = "Atinge múltiplos monstros ao mesmo tempo. Ideal para limpar salas cheias (Hunts/Boxes).";
        }

        return { category, targetType, color, icon: badgeIcon, explanation: roleExplanation };
    }

    async function fetchWikiSpells() {
        const vocSelect = document.getElementById('vocationSelect');
        const vocPage = vocSelect.value;
        const statusDiv = document.getElementById('status');
        const container = document.getElementById('spellsContainer');
        
        statusDiv.innerText = `Sincronizando ${vocPage} com a TibiaWiki...`;
        container.innerHTML = "<div class='text-center py-20 text-zinc-500'><i class='fa-solid fa-spinner animate-spin text-3xl mb-3 text-[#f3a63b] block'></i>Carregando banco de dados...</div>";

        const apiUrl = `https://www.tibiawiki.com.br/api.php?action=parse&page=${vocPage}&prop=text&format=json&origin=*`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Não foi possível conectar com os servidores da Wiki.");
            const data = await response.json();

            if (data.error) {
                throw new Error("Página da vocação não encontrada. Verifique as configurações.");
            }

            const htmlContent = data.parse.text["*"];
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            const tables = tempDiv.querySelectorAll('table');
            let spellsFound = [];

            tables.forEach(table => {
                // Tenta mapear os cabeçalhos para achar a coluna "Tipo"
                const ths = table.querySelectorAll('tr th');
                const headers = Array.from(ths).map(th => th.innerText.trim().toLowerCase());
                let tipoColIdx = -1;
                for (let idx = 0; idx < headers.length; idx++) {
                    if (headers[idx].includes('tipo') || headers[idx].includes('type')) {
                        tipoColIdx = idx;
                        break;
                    }
                }

                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cols = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
                    
                    const hasSpellWords = cols.some(text => {
                        const t = text.toLowerCase();
                        return t.startsWith('exori') || t.startsWith('exura') || t.startsWith('utito') || t.startsWith('utani') || t.startsWith('utamo') || t.startsWith('exana');
                    });

                    if (hasSpellWords && cols.length >= 3) {
                        let level = '1';
                        let levelIdx = cols.findIndex(text => !isNaN(parseInt(text)) && parseInt(text) > 0 && parseInt(text) < 1000);
                        if (levelIdx !== -1) {
                            level = cols[levelIdx];
                        }

                        let name = cols[0].replace(/\n/g, ' ').trim();
                        if ((name === '' || name.length < 3) && cols[1]) {
                            name = cols[1].replace(/\n/g, ' ').trim();
                        }

                        let words = cols.find(text => {
                            const t = text.toLowerCase();
                            return t.startsWith('exori') || t.startsWith('exura') || t.startsWith('utito') || t.startsWith('utani') || t.startsWith('utamo') || t.startsWith('exana');
                        });

                        let mana = 'N/A';
                        let manaCol = cols.find(text => text.toLowerCase().includes('mana') || (!isNaN(parseInt(text)) && parseInt(text) > 10 && text !== level));
                        if (manaCol) {
                            mana = manaCol.replace(/mana/gi, '').trim();
                        }

                        let wikiType = '';
                        if (tipoColIdx !== -1 && cols[tipoColIdx]) {
                            wikiType = cols[tipoColIdx];
                        } else if (cols.length >= 8) {
                            const possibleType = cols[7].toLowerCase();
                            if (possibleType.includes('suporte') || possibleType.includes('ataque') || possibleType.includes('cura') || possibleType.includes('support') || possibleType.includes('heal')) {
                                wikiType = cols[7];
                            }
                        }

                        if (name && words) {
                            spellsFound.push({
                                name: name,
                                level: parseInt(level),
                                words: words,
                                mana: mana,
                                wikiType: wikiType
                            });
                        }
                    }
                });
            });

            if (spellsFound.length === 0) {
                throw new Error("Nenhuma tabela estruturada de magias foi identificada nesta página.");
            }

            const uniqueSpells = [];
            const seenNames = new Set();
            for (const spell of spellsFound) {
                if (!seenNames.has(spell.name)) {
                    seenNames.add(spell.name);
                    uniqueSpells.push(spell);
                }
            }

            uniqueSpells.sort((a, b) => a.level - b.level);
            activeSpells = uniqueSpells;

            document.getElementById('vocName').innerText = vocPage;
            document.getElementById('characterName').innerText = "Player " + vocPage;
            const charNameHealing = document.getElementById('characterNameHealing');
            if (charNameHealing) {
                charNameHealing.innerText = "Player " + vocPage;
            }
            statusDiv.innerText = `Sucesso! Sincronizado com ${uniqueSpells.length} magias para a classe: ${vocPage}.`;
            
            // Limpa a rotação customizada ao trocar de classe para evitar erros de magias órfãs
            rotation = [];
            document.getElementById('rotationTimeline').innerHTML = `<p class="text-zinc-500 text-sm text-center w-full py-12">Monte sua sequência de teclas! Clique no botão "+" das magias à esquerda ou clique em "Aplicar na minha Linha do Tempo" acima.</p>`;
            
            updateSimulationSettings();

        } catch (error) {
            statusDiv.innerText = `Erro de Conexão: ${error.message}`;
            container.innerHTML = `<div class='text-center py-20 text-red-400'><i class='fa-solid fa-circle-xmark text-3xl mb-3 block'></i>Não conseguimos rastrear esta vocação. Certifique-se de que a Wiki está acessível.</div>`;
        }
    }

    function setHuntStyle(style) {
        currentHuntStyle = style;
        
        const btnArea = document.getElementById('btnArea');
        const btnSolo = document.getElementById('btnSolo');

        if (style === 'Area') {
            btnArea.className = "py-3 px-4 rounded-lg font-bold border transition duration-200 text-sm flex items-center justify-center gap-2 bg-[#f3a63b] text-black border-[#f3a63b]";
            btnSolo.className = "py-3 px-4 rounded-lg font-bold border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition duration-200 text-sm flex items-center justify-center gap-2";
        } else {
            btnSolo.className = "py-3 px-4 rounded-lg font-bold border transition duration-200 text-sm flex items-center justify-center gap-2 bg-[#f3a63b] text-black border-[#f3a63b]";
            btnArea.className = "py-3 px-4 rounded-lg font-bold border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition duration-200 text-sm flex items-center justify-center gap-2";
        }

        updateSimulationSettings();
    }

    function updateSimulationSettings() {
        currentLevel = parseInt(document.getElementById('charLevel').value);
        document.getElementById('levelBadge').innerText = `Level ${currentLevel}`;
        
        if (activeSpells.length > 0) {
            renderSpells();
            calculateSuggestedCombo();
        }
    }

    function renderSpells() {
        const container = document.getElementById('spellsContainer');
        container.innerHTML = "";
        let activeCount = 0;
        const voc = document.getElementById('vocName').innerText.trim();

        activeSpells.forEach((spell) => {
            const isUnlocked = spell.level <= currentLevel;
            const classInfo = getSpellClassification(spell, voc);
            const div = document.createElement('div');
            
            if (isUnlocked) {
                activeCount++;
                div.className = "flex flex-col bg-zinc-900 border border-zinc-800 p-3.5 rounded-lg hover:border-zinc-700 transition duration-150 cursor-pointer group";
                div.onclick = () => addToRotation(spell);
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex-grow pr-4">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-bold text-sm text-zinc-100 group-hover:text-[#f3a63b] transition duration-150">${spell.name}</h4>
                                <span class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">Lvl ${spell.level}</span>
                                <span class="text-[9px] bg-${classInfo.color}-950/40 text-${classInfo.color}-400 border border-${classInfo.color}-800/40 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <i class="fa-solid ${classInfo.icon}"></i> ${classInfo.category}
                                </span>
                            </div>
                            <p class="text-xs text-zinc-500 mt-2">Fórmula: <code class="text-zinc-400 font-mono">"${spell.words}"</code> | Mana: <span class="text-zinc-400">${spell.mana}</span></p>
                        </div>
                        <span class="bg-[#f3a63b]/10 group-hover:bg-[#f3a63b] text-[#f3a63b] group-hover:text-black w-8 h-8 rounded-full flex items-center justify-center transition duration-150 text-sm font-bold shadow-sm">+</span>
                    </div>
                `;
            } else {
                div.className = "flex items-center justify-between bg-zinc-950/40 border border-zinc-900/50 p-3.5 rounded-lg opacity-40 select-none cursor-not-allowed";
                div.innerHTML = `
                    <div class="flex-grow">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-sm text-zinc-400">${spell.name}</h4>
                            <span class="text-[10px] bg-zinc-900 text-red-500/80 px-1.5 py-0.5 rounded font-bold">Bloqueada (Lvl ${spell.level})</span>
                        </div>
                    </div>
                    <span class="text-zinc-700 text-xs"><i class="fa-solid fa-lock"></i></span>
                `;
            }
            container.appendChild(div);
        });

        document.getElementById('activeCount').innerText = `${activeCount} Ativas`;
    }

    function renderSimulatedCasterPanel(combo) {
        const slotsContainer = document.getElementById('simulatedCasterSlots');
        const tableBody = document.getElementById('manualConfigTableBody');
        
        slotsContainer.innerHTML = "";
        tableBody.innerHTML = "";

        const voc = document.getElementById('vocName').innerText.trim();
        // Filtra para exibir apenas magias de ataque (excluindo suporte, buffs e cura)
        const filteredCombo = combo.filter(spell => {
            const classInfo = getSpellClassification(spell, voc);
            return classInfo.category !== "Suporte / Buff" && classInfo.category !== "Cura";
        });

        const syncBadge = document.getElementById('rtcSyncBadge');
        if (syncBadge) {
            syncBadge.innerText = `Sincronizado Lvl ${currentLevel}`;
        }

        const panel = document.getElementById('rtcPanel');
        if (panel) {
            panel.classList.add('glow-active');
            setTimeout(() => {
                panel.classList.remove('glow-active');
            }, 500);
        }

        for (let i = 0; i < 5; i++) {
            const spell = filteredCombo[i];
            const div = document.createElement('div');
            div.className = "flex items-center gap-2 bg-[#252629] p-1.5 rounded border border-[#1a1b1c] shadow-inner";

            if (spell) {
                let defaultCreatures = "1+";
                let defaultPriority = "1st";
                let defaultMana = "5%";

                const name = spell.name.toLowerCase();
                if (name.includes('outburst') || name.includes('sweeping') || name.includes('brawl')) {
                    defaultCreatures = "3+";
                    defaultPriority = "1st";
                    defaultMana = "5%";
                } else if (name.includes('flurry') || name.includes('penance')) {
                    defaultCreatures = "2+";
                    defaultPriority = "1st";
                    defaultMana = "5%";
                } else if (name.includes('virtue') || name.includes('justice') || name.includes('harmony')) {
                    defaultCreatures = "1+";
                    defaultPriority = "2nd";
                    defaultMana = "5%";
                }

                div.innerHTML = `
                    <div class="ot-slot w-8 h-8 rounded flex items-center justify-center text-[10px] text-zinc-400 relative font-bold cursor-pointer">
                        <i class="fa-solid fa-wand-magic-sparkles text-[#f3a63b]"></i>
                        <span class="absolute bottom-0 right-0.5 text-[8px] text-white">S${i+1}</span>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <span class="text-white font-bold block text-[10px] truncate">${spell.name}</span>
                        <span class="text-zinc-400 text-[8px] block truncate"><code class="text-[#f3a63b] font-mono">"${spell.words}"</code></span>
                    </div>

                    <div class="flex items-center gap-0.5">
                        <span class="text-[8px] text-zinc-400">Mana:</span>
                        <input type="text" readonly value="${defaultMana}" class="ot-input w-8 text-center text-[9px] rounded font-mono py-0.5">
                    </div>

                    <div class="flex items-center gap-0.5">
                        <span class="text-[8px] text-zinc-400">Mobs:</span>
                        <select disabled class="bg-[#161719] border border-[#484a51] text-[9px] text-zinc-300 rounded py-0.5 px-0.5 focus:outline-none">
                            <option ${defaultCreatures === "1+" ? 'selected' : ''}>1+</option>
                            <option ${defaultCreatures === "2+" ? 'selected' : ''}>2+</option>
                            <option ${defaultCreatures === "3+" ? 'selected' : ''}>3+</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-0.5">
                        <span class="text-[8px] text-zinc-400">Prio:</span>
                        <select disabled class="bg-[#161719] border border-[#484a51] text-[9px] text-zinc-300 rounded py-0.5 px-0.5 focus:outline-none">
                            <option ${defaultPriority === "1st" ? 'selected' : ''}>1st</option>
                            <option ${defaultPriority === "2nd" ? 'selected' : ''}>2nd</option>
                            <option ${defaultPriority === "3rd" ? 'selected' : ''}>3rd</option>
                        </select>
                    </div>
                `;

                // Adiciona o elemento equivalente na tabela de configuração manual rápida
                const tr = document.createElement('tr');
                tr.className = "hover:bg-zinc-900/40 transition-colors";
                tr.innerHTML = `
                    <td class="py-2 text-zinc-200 font-bold">${spell.name}</td>
                    <td class="py-2 text-center text-emerald-400 font-mono">${defaultMana}</td>
                    <td class="py-2 text-center text-[#f3a63b] font-bold">${defaultCreatures}</td>
                    <td class="py-2 text-right"><span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[9px] font-bold">${defaultPriority}</span></td>
                `;
                tableBody.appendChild(tr);

            } else {
                div.innerHTML = `
                    <div class="ot-slot w-8 h-8 rounded flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                        Vazio
                    </div>
                    <div class="flex-1 text-zinc-500 italic text-[10px] pl-2">Slot não configurado</div>
                    <span class="text-[8px] text-zinc-600">Nenhum feitiço</span>
                `;
                slotsContainer.appendChild(div);
            }

            if (spell) {
                slotsContainer.appendChild(div);
            }
        }

        if (filteredCombo.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-zinc-600 italic">Nenhuma magia de ataque ativa no combo. Adicione magias para ver as sugestões manuais.</td></tr>`;
        }
    }

    function updateCasterState() {
        if (rotation.length > 0) {
            renderSimulatedCasterPanel(rotation);
        } else {
            renderSimulatedCasterPanel(suggestedCombo);
        }
        renderSimulatedHealingPanel();
    }

    function switchTab(tab) {
        const rtcContent = document.getElementById('rtcasterTabContent');
        const healingContent = document.getElementById('healingTabContent');
        const tabBtnCaster = document.getElementById('tabBtnCaster');
        const tabBtnHealing = document.getElementById('tabBtnHealing');
        
        const rtcGuideText = document.getElementById('rtcGuideText');
        const healingGuideText = document.getElementById('healingGuideText');
        const rtcGuideTable = document.getElementById('rtcGuideTable');
        const healingGuideTable = document.getElementById('healingGuideTable');

        const simTitle = document.getElementById('simulationTitle');

        if (tab === 'rtcaster') {
            if (rtcContent) rtcContent.classList.remove('hidden');
            if (healingContent) healingContent.classList.add('hidden');
            
            if (tabBtnCaster) tabBtnCaster.className = "px-2.5 py-0.5 rounded text-[10px] bg-[#3b3d42] text-white font-bold border border-[#222426] transition-all";
            if (tabBtnHealing) tabBtnHealing.className = "px-2.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white font-bold transition-all";

            if (rtcGuideText) rtcGuideText.classList.remove('hidden');
            if (healingGuideText) healingGuideText.classList.add('hidden');
            if (rtcGuideTable) rtcGuideTable.classList.remove('hidden');
            if (healingGuideTable) healingGuideTable.classList.add('hidden');

            if (simTitle) simTitle.innerText = "RTCaster - RubinOT Assistant";
        } else {
            if (rtcContent) rtcContent.classList.add('hidden');
            if (healingContent) healingContent.classList.remove('hidden');
            
            if (tabBtnCaster) tabBtnCaster.className = "px-2.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white font-bold transition-all";
            if (tabBtnHealing) tabBtnHealing.className = "px-2.5 py-0.5 rounded text-[10px] bg-[#3b3d42] text-white font-bold border border-[#222426] transition-all";

            if (rtcGuideText) rtcGuideText.classList.add('hidden');
            if (healingGuideText) healingGuideText.classList.remove('hidden');
            if (rtcGuideTable) rtcGuideTable.classList.add('hidden');
            if (healingGuideTable) healingGuideTable.classList.remove('hidden');

            if (simTitle) simTitle.innerText = "Healing - RubinOT Assistant";
        }
    }

    function renderSimulatedHealingPanel() {
        const spellContainer = document.getElementById('spellHealingSlots');
        const potionContainer = document.getElementById('potionHealingSlots');
        const tableBody = document.getElementById('healingConfigTableBody');
        const sioContainer = document.getElementById('sioSectionContainer');
        
        if (!spellContainer || !potionContainer || !tableBody) return;
        
        spellContainer.innerHTML = "";
        potionContainer.innerHTML = "";
        tableBody.innerHTML = "";
        
        const voc = document.getElementById('vocName').innerText.trim();
        const vocL = voc.toLowerCase();
        
        // 1. Spell Healing
        const available = activeSpells.filter(s => s.level <= currentLevel);
        const healingSpells = available.filter(s => {
            const classInfo = getSpellClassification(s, voc);
            return classInfo.category === "Cura" && classInfo.targetType !== "Heal Amigo";
        });
        healingSpells.sort((a, b) => a.level - b.level);

        const friendHealingSpells = available.filter(s => {
            const classInfo = getSpellClassification(s, voc);
            return classInfo.category === "Cura" && classInfo.targetType === "Heal Amigo";
        });
        
        let spells = [];
        if (healingSpells.length > 0) {
            spells = healingSpells.map((s, idx) => {
                let hp = 85;
                if (idx === 1) hp = 70;
                if (idx === 2) hp = 45;
                if (idx > 2) hp = 30;
                return { name: s.name, words: s.words, hp: hp };
            });
        } else {
            // Fallback hardcoded por vocação
            if (vocL.includes('monk')) {
                spells = [
                    { name: "Serene Rest", words: "exura monk", hp: 85 },
                    { name: "Sustain Mend", words: "exura gran monk", hp: 65 },
                    { name: "Nirvana Cure", words: "exura vita monk", hp: 45 }
                ];
            } else if (vocL.includes('knight')) {
                spells = [
                    { name: "Wound Cleansing", words: "exura ico", hp: 85 }
                ];
                if (currentLevel >= 150) spells.push({ name: "Intense Wound Cleansing", words: "exura med ico", hp: 70 });
                if (currentLevel >= 250) spells.push({ name: "Ultimate Wound Cleansing", words: "exura gran ico", hp: 45 });
            } else if (vocL.includes('paladin')) {
                spells = [
                    { name: "Light Healing", words: "exura", hp: 90 },
                    { name: "Salvation", words: "exura san", hp: 80 }
                ];
                if (currentLevel >= 60) spells.push({ name: "Divine Healing", words: "exura gran san", hp: 60 });
            } else if (vocL.includes('sorcerer') || vocL.includes('druid')) {
                spells = [
                    { name: "Light Healing", words: "exura", hp: 90 },
                    { name: "Intense Healing", words: "exura gran", hp: 75 }
                ];
                if (currentLevel >= 30) spells.push({ name: "Ultimate Healing", words: "exura vita", hp: 60 });
            }
        }
        
        const spellSlots = spells.slice(0, 3);
        
        for (let i = 0; i < 3; i++) {
            const spell = spellSlots[i];
            const div = document.createElement('div');
            div.className = "flex items-center justify-between gap-2 bg-[#252629] p-1.5 rounded border border-[#1a1b1c] shadow-inner";
            
            if (spell) {
                div.innerHTML = `
                    <div class="ot-slot w-8 h-8 rounded flex items-center justify-center text-[10px] text-zinc-400 relative font-bold cursor-pointer">
                        <i class="fa-solid fa-heart text-teal-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-white font-bold block text-[10px] truncate">${spell.name}</span>
                        <span class="text-zinc-400 text-[8px] block truncate"><code class="text-teal-400 font-mono">"${spell.words}"</code></span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="text-[8px] text-zinc-400">Ativ.:</span>
                        <input type="text" readonly value="${spell.hp}% HP" class="ot-input w-12 text-center text-[9px] rounded font-mono py-0.5">
                    </div>
                `;
                
                const tr = document.createElement('tr');
                tr.className = "hover:bg-zinc-900/40 transition-colors";
                tr.innerHTML = `
                    <td class="py-2 text-zinc-200 font-bold">${spell.name} <code class="text-zinc-500 font-mono text-[9px]">("${spell.words}")</code></td>
                    <td class="py-2 text-center text-teal-400 font-bold">${spell.hp}% HP</td>
                    <td class="py-2 text-right"><span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[9px] font-bold">Magia (Heal)</span></td>
                `;
                tableBody.appendChild(tr);
            } else {
                div.innerHTML = `
                    <div class="ot-slot w-8 h-8 rounded flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                        Vazio
                    </div>
                    <div class="flex-1 text-zinc-500 italic text-[10px] pl-2">Slot não configurado</div>
                    <span class="text-[8px] text-zinc-600">Nenhum feitiço</span>
                `;
            }
            spellContainer.appendChild(div);
        }
        
        // 2. Potion Healing
        let potions = [];
        if (vocL.includes('knight')) {
            let hpPotion = "Health Potion";
            if (currentLevel >= 50) hpPotion = "Strong Health Potion";
            if (currentLevel >= 80) hpPotion = "Great Health Potion";
            if (currentLevel >= 130) hpPotion = "Ultimate Health Potion";
            if (currentLevel >= 200) hpPotion = "Supreme Health Potion";

            potions = [
                { name: hpPotion, resource: "HP", threshold: 60, type: "Potion (HP)" },
                { name: "Strong Mana Potion", resource: "Mana", threshold: 80, type: "Potion (Mana)" }
            ];
        } else if (vocL.includes('paladin')) {
            let manaPotion = "Mana Potion";
            if (currentLevel >= 50) manaPotion = "Strong Mana Potion";
            if (currentLevel >= 80) manaPotion = "Great Mana Potion";

            let spiritPotion = "Health Potion";
            if (currentLevel >= 80) spiritPotion = "Great Spirit Potion";
            if (currentLevel >= 130) spiritPotion = "Ultimate Spirit Potion";

            potions = [
                { name: spiritPotion, resource: "HP", threshold: 50, type: "Potion (HP)" },
                { name: manaPotion, resource: "Mana", threshold: 75, type: "Potion (Mana)" }
            ];
        } else {
            // Sorcerer, Druid, Monk
            let manaPotion = "Mana Potion";
            if (currentLevel >= 50) manaPotion = "Strong Mana Potion";
            if (currentLevel >= 80) manaPotion = "Great Mana Potion";
            if (currentLevel >= 130) manaPotion = "Ultimate Mana Potion";

            let hpPotion = "Health Potion";
            if (currentLevel >= 50) hpPotion = "Strong Health Potion";
            if (currentLevel >= 80) hpPotion = "Great Health Potion";

            potions = [
                { name: manaPotion, resource: "Mana", threshold: 85, type: "Potion (Mana)" },
                { name: hpPotion, resource: "HP", threshold: 45, type: "Potion (HP)" }
            ];
        }
        
        // Add Mana Training to potions list visual representation for slot 3
        const manaTrainThreshold = vocL.includes('knight') ? 90 : (vocL.includes('paladin') ? 95 : 98);
        potions.push({ name: "Mana Training", resource: "Mana", threshold: manaTrainThreshold, type: "Utility / Treino" });
        
        for (let i = 0; i < 3; i++) {
            const pot = potions[i];
            const div = document.createElement('div');
            div.className = "flex items-center justify-between gap-2 bg-[#252629] p-1.5 rounded border border-[#1a1b1c] shadow-inner";
            
            if (pot) {
                const icon = pot.name === "Mana Training" ? "fa-graduation-cap text-indigo-400" : "fa-flask text-rose-400";
                div.innerHTML = `
                    <div class="ot-slot w-8 h-8 rounded flex items-center justify-center text-[10px] text-zinc-400 relative font-bold cursor-pointer">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-white font-bold block text-[10px] truncate">${pot.name}</span>
                        <span class="text-zinc-400 text-[8px] block truncate">${pot.name === "Mana Training" ? "Gasta mana para treinar" : "Recuperação de " + pot.resource}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="text-[8px] text-zinc-400">Ativ.:</span>
                        <input type="text" readonly value="${pot.threshold}% ${pot.resource}" class="ot-input w-12 text-center text-[9px] rounded font-mono py-0.5">
                    </div>
                `;
                
                const tr = document.createElement('tr');
                tr.className = "hover:bg-zinc-900/40 transition-colors";
                tr.innerHTML = `
                    <td class="py-2 text-zinc-200 font-bold">${pot.name}</td>
                    <td class="py-2 text-center text-[#f3a63b] font-bold">${pot.threshold}% ${pot.resource}</td>
                    <td class="py-2 text-right"><span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[9px] font-bold">${pot.type}</span></td>
                `;
                tableBody.appendChild(tr);
            } else {
                div.innerHTML = `
                    <div class="ot-slot w-8 h-8 rounded flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                        Vazio
                    </div>
                    <div class="flex-1 text-zinc-500 italic text-[10px] pl-2">Slot não configurado</div>
                    <span class="text-[8px] text-zinc-600">Nenhuma poção</span>
                `;
            }
            potionContainer.appendChild(div);
        }
        
        // 3. Sio Config or General Note
        if (sioContainer) {
            const hasFriendHeal = vocL.includes('druid') || friendHealingSpells.length > 0 || vocL.includes('monk');
            if (hasFriendHeal) {
                let defaultFriendSpell = "exura sio";
                let defaultFriendSpellName = "Heal Amigo (Sio)";
                
                if (friendHealingSpells.length > 0) {
                    defaultFriendSpell = friendHealingSpells[0].words;
                    defaultFriendSpellName = friendHealingSpells[0].name;
                } else if (vocL.includes('monk')) {
                    defaultFriendSpell = "exura sio monk";
                    defaultFriendSpellName = "Restore Balance";
                }
                
                sioContainer.innerHTML = `
                    <div class="bg-[#252629] p-3 rounded border border-[#1a1b1c] shadow-inner text-xs space-y-2">
                        <span class="text-teal-400 font-bold block text-[10px] uppercase"><i class="fa-solid fa-users"></i> Configuração de Sio / Heal Amigo (${defaultFriendSpellName})</span>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-white text-[10px]">Enable Sio:</span>
                                <input type="checkbox" checked disabled class="accent-[#f3a63b]">
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-white text-[10px]">Formula / Words:</span>
                                <code class="text-teal-400 font-mono text-[9px]">"${defaultFriendSpell}"</code>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-white text-[10px]">Heal Friend HP:</span>
                                <input type="text" readonly value="85%" class="ot-input w-12 text-center text-[9px] rounded font-mono py-0.5">
                            </div>
                        </div>
                        <p class="text-[10px] text-zinc-400 italic mt-1">Configure o nome do seu Knight parceiro na "Sio Friend List" para curá-lo automaticamente quando ele estiver abaixo de 85% de HP.</p>
                    </div>
                `;
            } else {
                sioContainer.innerHTML = `
                    <div class="bg-[#1e2022] p-2.5 rounded border border-[#1a1b1c] text-[10px] text-zinc-400 italic">
                        <i class="fa-solid fa-circle-info text-[#f3a63b] mr-1"></i> <b>Nota de Combate:</b> Mantenha a cura e a poção em hotkeys confortáveis para garantir reações rápidas em situações críticas.
                    </div>
                `;
            }
        }
    }

    function calculateSuggestedCombo() {
        const container = document.getElementById('suggestedComboContainer');
        const explainer = document.getElementById('rotationExplainer');
        const analysisContainer = document.getElementById('stepByStepAnalysis');
        
        container.innerHTML = "";
        analysisContainer.innerHTML = "";

        const available = activeSpells.filter(s => s.level <= currentLevel);
        const voc = document.getElementById('vocName').innerText.trim();
        const vocL = voc.toLowerCase();
        
        if (available.length === 0) {
            container.innerHTML = `<p class="text-zinc-500 text-xs text-center w-full">Nenhuma magia desbloqueada para este nível.</p>`;
            return;
        }

        let combo = [];
        let expText = "";

        if (vocL.includes('monk')) {
            const builderArea = ["greater flurry of blows", "chained penance", "thousand fist blows", "flurry of blows"];
            const builderSolo = ["forceful uppercut", "thousand fist blows", "mystic repulse", "lesser mystic repulse", "double jab", "swift jab"];
            const spendersArea = ["sweeping takedown", "spiritual outburst"];
            const spendersSolo = ["devastating knockout", "greater tiger clash", "tiger clash"];
            const buffs = ["virtue of harmony", "virtue of justice", "virtue of sustain"];

            // Filtra e inverte a ordenação para o algoritmo priorizar as magias de nível mais alto (descendente)
            let myBuilders = available.filter(s => {
                const nameL = s.name.toLowerCase().trim();
                return currentHuntStyle === 'Area' ? builderArea.includes(nameL) : builderSolo.includes(nameL);
            });
            let mySpenders = available.filter(s => {
                const nameL = s.name.toLowerCase().trim();
                return currentHuntStyle === 'Area' ? spendersArea.includes(nameL) : spendersSolo.includes(nameL);
            });
            let myBuffs = available.filter(s => {
                const nameL = s.name.toLowerCase().trim();
                return buffs.includes(nameL);
            });

            myBuilders.sort((a, b) => b.level - a.level);
            mySpenders.sort((a, b) => b.level - a.level);
            myBuffs.sort((a, b) => b.level - a.level);

            if (myBuilders.length === 0) {
                myBuilders = available.filter(s => s.words.includes('pug') || s.words.includes('med'));
                myBuilders.sort((a, b) => b.level - a.level);
            }
            if (mySpenders.length === 0) {
                mySpenders = available.filter(s => s.words.includes('nia') || s.words.includes('gran mas'));
                mySpenders.sort((a, b) => b.level - a.level);
            }

            if (myBuffs.length > 0) combo.push(myBuffs[0]); 
            if (myBuilders.length > 0) combo.push(myBuilders[0]);
            if (myBuilders.length > 1 && myBuilders[1].name !== myBuilders[0].name) combo.push(myBuilders[1]);
            if (mySpenders.length > 0) combo.push(mySpenders[0]); 

            expText = `Como o <strong>Monk</strong> usa o sistema de <strong>Harmonia</strong>, a rotação ideal consiste em ativar um Buff/Virtude de abertura, carregar a barra usando os ataques <i>Geradores (Builders)</i> e finalizar descarregando todo o recurso em um ataque <i>Gastador (Spender)</i> de alto impacto.`;
        } 
        else if (vocL.includes('knight')) {
            const areaAttacks = ["Fierce Berserk", "Berserk", "Groundshaker", "Front Sweep"];
            const singleAttacks = ["Fierce Berserk", "Brutal Strike", "Annihilation", "Front Sweep"];
            const buffs = ["Blood Rage", "Sharpshooter"];

            let myBuffs = available.filter(s => buffs.some(b => s.name.includes(b) || s.words.includes('utito')));
            let attacks = available.filter(s => currentHuntStyle === 'Area' ? areaAttacks.some(a => s.name.includes(a)) : singleAttacks.some(a => s.name.includes(a)));

            if (myBuffs.length > 0) combo.push(myBuffs[0]);
            
            attacks.sort((a,b) => b.level - a.level);
            if (attacks.length > 0) combo.push(attacks[0]);
            if (attacks.length > 1) combo.push(attacks[1]);
            if (attacks.length > 2) combo.push(attacks[2]);

            expText = `A rotação do <strong>Knight (EK)</strong> gira em torno de ativar o seu buff físico <i>Utito Tempo</i> (para amplificar o dano da arma) e ciclar os seus principais feitiços de ataque na ordem do maior dano para o menor, revezando os tempos de recarga (cooldowns) para nunca ficar em turno morto.`;
        } 
        else {
            let attacks = available.filter(s => s.words.startsWith('exevo') || s.words.startsWith('exori'));
            attacks.sort((a,b) => b.level - a.level); 

            if (attacks.length > 0) combo.push(attacks[0]);
            if (attacks.length > 1) combo.push(attacks[1]);
            if (attacks.length > 2) combo.push(attacks[2]);
            if (attacks.length > 3) combo.push(attacks[3]);

            expText = `Para esta vocação, a inteligência intercala suas magias de ataque mais fortes de alto nível (para maximizar o DPS) com magias de menor cooldown e utilitários de suporte correspondentes ao nível selecionado.`;
        }

        if (combo.length === 0) {
            combo = available.slice(0, 4);
            expText = `Exibindo magias sequenciais básicas para personagens de nível inicial.`;
        }

        suggestedCombo = combo;

        combo.forEach((spell, idx) => {
            const card = document.createElement('div');
            card.className = "flex-shrink-0 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center min-w-[120px] shadow-md relative";
            card.innerHTML = `
                <div class="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-[#f3a63b] text-black text-xs font-bold flex items-center justify-center shadow-md">${idx + 1}</div>
                <h5 class="font-bold text-xs text-zinc-200 mt-1 truncate">${spell.name}</h5>
                <p class="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">"${spell.words}"</p>
            `;
            container.appendChild(card);
        });

        explainer.innerHTML = expText;

        combo.forEach((spell, idx) => {
            const classInfo = getSpellClassification(spell, voc);
            const lowerName = spell.name.toLowerCase();
            
            let spellTactic = spellCommentaries[lowerName];
            if (!spellTactic) {
                if (classInfo.category === "Cura") {
                    spellTactic = "Magia crucial de sobrevivência. Use para estabilizar seu life bar e evitar mortes acidentais.";
                } else if (classInfo.category === "Suporte / Buff") {
                    spellTactic = "Sua magia de suporte tático. Serve para melhorar suas defesas ou aumentar sua velocidade nas passagens de salas.";
                } else {
                    spellTactic = `Ataque direto do tipo ${classInfo.targetType}. Use para desgastar as ondas de criaturas com máxima eficiência tática.`;
                }
            }

            const stepCard = document.createElement('div');
            stepCard.className = "flex items-start gap-3 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition duration-150";
            stepCard.innerHTML = `
                <div class="bg-[#f3a63b]/10 text-[#f3a63b] text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center border border-[#f3a63b]/20 flex-shrink-0">
                    #${idx + 1}
                </div>
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <strong class="text-xs text-zinc-100 font-bold">${spell.name}</strong>
                        <span class="text-[9px] bg-${classInfo.color}-950/50 text-${classInfo.color}-400 px-1.5 py-0.2 rounded font-semibold border border-${classInfo.color}-800/20">${classInfo.category}</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 mt-1 leading-relaxed"><i class="fa-solid fa-circle-play text-[#f3a63b] mr-1 text-[9px]"></i><strong>Objetivo:</strong> ${spellTactic}</p>
                </div>
            `;
            analysisContainer.appendChild(stepCard);
        });

        updateCasterState();
    }

    function applySuggestedRotation() {
        if (suggestedCombo.length === 0) return;
        rotation = [...suggestedCombo];
        renderRotation();
        showNotification("Combo sugerido pela inteligência foi aplicado na sua linha do tempo!", "success");
    }

    function addToRotation(spell) {
        rotation.push(spell);
        renderRotation();
    }

    function removeFromRotation(index) {
        rotation.splice(index, 1);
        renderRotation();
    }

    function clearRotation() {
        rotation = [];
        renderRotation();
    }

    function renderRotation() {
        const timeline = document.getElementById('rotationTimeline');
        timeline.innerHTML = "";

        if (rotation.length === 0) {
            timeline.innerHTML = `<p class="text-zinc-500 text-sm text-center w-full py-12">Monte sua sequência de teclas! Clique no botão "+" das magias à esquerda ou clique em "Aplicar na minha Linha do Tempo" acima.</p>`;
            updateCasterState();
            return;
        }

        rotation.forEach((spell, index) => {
            const item = document.createElement('div');
            item.className = "flex items-center gap-3 bg-zinc-900 border border-zinc-800 pl-4 pr-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-200 shadow-md group hover:border-[#f3a63b]/30 transition duration-150";
            item.innerHTML = `
                <span class="text-xs text-zinc-500 font-bold font-mono">${index + 1}.</span>
                <div>
                    <span class="text-zinc-100">${spell.name}</span>
                    <span class="text-[10px] font-mono text-zinc-500 block">"${spell.words}"</span>
                </div>
                <span class="remove text-zinc-600 group-hover:text-red-400 cursor-pointer ml-2 text-xs font-bold transition duration-150" onclick="removeFromRotation(${index})">✕</span>
            `;
            timeline.appendChild(item);
        });

        updateCasterState();
    }

    window.onload = () => {
        fetchWikiSpells();
    }