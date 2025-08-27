# Finesse Notifier

A **Finesse Notifier** é uma extensão para o **Google Chrome** que monitora o status do **Cisco Finesse** em tempo real e notifica o agente sobre mudanças de status ou inatividade. O objetivo é **otimizar a produtividade** e garantir que o agente esteja sempre ciente da sua situação no sistema, evitando períodos prolongados de inatividade.

---

## Funcionalidades
- Monitoramento contínuo do status do agente no Cisco Finesse.
- Notificações automáticas em caso de **mudança de status** (Pronto, Não Pronto, etc.).
- Alertas visuais, sonoros e foco automático na aba do Finesse, em caso de **inatividade prolongada**. 
- Configuração personalizada de **tempo de pausa (minutos)**.
- Interface moderna, responsiva e fácil de usar.
- Integração com APIs do Chrome para execução em segundo plano.

---

## Tecnologias Utilizadas

- **HTML, CSS e JavaScript** → base do front-end e lógica de interação.
- **Bootstrap v5.3** → design responsivo e moderno.
- **APIs do Cisco Finesse** → integração com o servidor Finesse:
  - `GET /finesse/api/User/{userId}` → retorna o status atual do agente (atividade, estado e motivo).
- **APIs do Google Chrome** → suporte à execução da extensão:
  - `chrome.storage` → armazenamento seguro de credenciais e configurações.
  - `chrome.alarms` → agendamento de verificações periódicas.
  - `chrome.notifications` → envio de alertas visuais/sonoros.
  - `chrome.runtime.onInstalled` → configuração inicial após instalação/atualização.

---

## Instalação e Teste Local

Para rodar a extensão localmente no Chrome:

1. Clone o repositório:
   ```bash
   git clone https://github.com/rafarcanjoatos/ExtensaoFinesse.git
   ```

2. Abra o Google Chrome e vá para `chrome://extensions/`.

3. Ative o **Modo Desenvolvedor** (Developer mode).

4. Clique em **Carregar sem compactação** (Load unpacked).

5. Selecione a pasta do repositório clonado.

6. A extensão será instalada e o ícone aparecerá no navegador. Clique nele para abrir a interface e configurar os timers.

7. Você poderá realizar o **Teste de Notificação** do menu, mas para ter uma experiência completa, é necessário acessar como agente de telefonia no **https://sncfinesse1.totvs.com.br:8445/** ou **https://sncfinesse2.totvs.com.br:8445/**

---

## Instalação via Chrome Web Store

Para instalar diretamente a partir da Chrome Web Store, basta acessar o link abaixo e clicar em **Adicionar ao Chrome**:

🔗 [Finesse Notifier na Chrome Web Store](https://chromewebstore.google.com/detail/finesse-notifier/cglkkcedledghdpkbopambajgmjmkkab)

Sempre que o finesse for iniciado, a extensão detecta automaticamente.

---

## Documentação Interna

Foi desenvolvida a documentação interna da **TOTVS Developer Network (TDN)** para guiar a instalação e utilização da extensão.

🔗 [TOTVS Developer Network - Cisco Finesse API](https://tdn.totvs.com/pages/viewpage.action?pageId=961629221)

---

## Equipe de Desenvolvimento

**Desenvolvimento**
Rafael Arcanjo - rafael.arcanjo@totvs.com.br

**Apoio técnico**
Abner de Assis Athayde - abner.athayde@fluig.com

**Mockups Design Final**
Thiago Orsi - thiago.orsi@totvs.com.br

**Coordenador da Área**
Rafael Maciel Vanat - rafael.vanat@fluig.com

**Gestor da Área**
Gilberto de Aguiar - gilberto.aguiar@fluig.com


---

## 📌 Roadmap Futuro
- [ ] Implementar diferentes timers para cada evento.
- [ ] Notificações para Mobile.
- [ ] Integração com Google Calendar
- [ ] Mudança automática de status ao clicar no popup de alerta

---

## 📄 Licença
Este projeto é de propriedade da **TOTVS**.  
O uso, modificação e distribuição estão sujeitos às políticas internas e diretrizes da empresa.  
Não é permitido uso comercial ou redistribuição sem autorização prévia da TOTVS.

---

👨‍💻 Desenvolvido por [Rafael Arcanjo](https://github.com/rafarcanjoatos)
