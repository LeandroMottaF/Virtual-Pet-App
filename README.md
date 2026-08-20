# 🐾 Tamagotchi (Virtual Pet)
Um aplicativo de bichinho virtual estilo retro/pixel art desenvolvido em React Native e Expo! O projeto simula a experiência clássica de cuidar de um pet virtual diretamente no celular, com sistema de movimentação, estado de fome, limpeza e persistência de dados.

📱 Nota do Desenvolvedor: Este projeto foi desenvolvido como um estudo e treino prático de desenvolvimento mobile, explorando conceitos de gerenciamento de estado complexo, loops de animação com sprites, manipulação de gestures/interações, persistência de dados locais e compilação de builds nativas com Expo EAS.

## 🎮 Como Jogar e Funcionalidades
Dê um Nome ao seu Pet: Assim que o app inicia pela primeira vez, você escolhe o nome do seu companheiro para começar a aventura.

## Sistema de Fome 🍖:

Compre carne e arraste até o seu pet para alimentá-lo.

Se a fome chegar a 0%, o pet começará a chorar e, após um período sem cuidados, ele pode morrer.

### Limpeza e Moedas 🧹:

Com o tempo, o pet fará sujeiras no cenário. Arraste a vassoura até as sujeiras para limpá-las.

Cada limpeza concede moedas ao jogador.

Loja 🛒: Use as moedas acumuladas na loja para comprar mais comida para o seu pet.

Nível de Amizade 📊: Interaja e cuide do seu pet para aumentar o nível de amizade e acompanhar as estatísticas no menu de perfil.

Animações e Especiais ✨: Os pets contam com ciclos de caminhada, piscadas dinâmicas e animações especiais periódicas.

Persistência de Dados 💾: O progresso do jogo, moedas, itens e o estado do pet são salvos localmente (mesmo com o app fechado ou se o celular for reiniciado).

### 🛠️ Tecnologias Utilizadas
React Native & TypeScript

Expo (Expo Router, Expo Asset, Expo EAS Build)

AsyncStorage (Salvamento local de progresso)

React Native Animated & PanResponder (Animações e interações de drag-and-drop)

# 🚀 Como Executar o Projeto Localmente
Clone o repositório:

'''
git clone https://github.com/leandromottafs/tamagotchi.git
cd tamagotchi
Instale as dependências:
'''

'''
npm install
Inicie o servidor de desenvolvimento:
'''

'''
npx expo start
Execute no dispositivo:
'''

Abra o aplicativo Expo Go no celular e escaneie o código QR gerado no terminal, ou

Pressione a para rodar no emulador Android.
