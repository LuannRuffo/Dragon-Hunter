Esta documentação descreve as funcionalidades e comandos do bot para gerenciamento de Nodewar. Todos os comandos devem ser precedidos pelo prefixo ! .

Os comandos de resetes e agendamento so funcionam se anteceder o comando quadro

📋 Comandos de Gerenciamento de Quadros
Estes comandos são utilizados para criar e configurar a lista de presença (quadro) para as batalhas.

!quadro 1: Inicializa um quadro de presença para Nodewar com 25 vagas disponíveis.

!quadro 2: Inicializa um quadro de presença para Nodewar com 30 vagas disponíveis.

🔄 Comandos de Reset
Utilize estes comandos para limpar o quadro atual e iniciar uma nova contagem imediatamente.

!reset 1: Apaga o quadro atual e inicia um novo com as configurações do Quadro 1 (25 vagas).

!reset 2: Apaga o quadro atual e inicia um novo com as configurações do Quadro 2 (30 vagas).

⏰ Agendamento Automático
Configura o bot para executar o reset automaticamente em um horário fixo.

!agendar 1: Programa o comando !reset 1 para ser executado todos os dias às 22:00h.

!agendar 2: Programa o comando !reset 2 para ser executado todos os dias às 22:00h.

🧹 Limpeza e Manutenção
O bot possui funções integradas para manter o chat organizado e livre de mensagens desnecessárias.

!clean: Remove instantaneamente as últimas 100 linhas de mensagens no canal onde o comando for executado.

Auto-Limpeza: O bot possui um sistema de limpeza automática. Todas as mensagens enviadas no canal (comandos, confirmações ou conversas) serão apagadas após 60 segundos, com exceção da mensagem principal que contém o Quadro de Vagas.

⏳ Sistema de Lista de Espera
O bot gerencia automaticamente o excesso de jogadores:

Quando todas as vagas de um quadro (25 ou 30) forem preenchidas, qualquer usuário adicional que tentar se inscrever será automaticamente colocado em uma Lista de Espera, exibida logo abaixo do quadro principal.