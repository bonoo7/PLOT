# React Native Client Structure

Since we are in a CLI environment without a full React Native build chain (Android Studio/Xcode), I will structure the code so you can easily copy it into a real React Native project (created via `npx react-native init` or `npx create-expo-app`).

## Directory Structure
```
/client-mobile
  ├── App.js              # Main entry point
  ├── src
  │   ├── screens
  │   │   ├── LoginScreen.js
  │   │   ├── LobbyScreen.js
  │   │   └── GameScreen.js
  │   ├── components
  │   │   └── RoleCard.js
  │   └── styles
  │       └── theme.js
  └── package.json        # Dependencies
```

## Instructions to Run
1. On your local machine, run: `npx create-expo-app plot-mobile`
2. Copy the contents of `client-mobile/src` to your new project.
3. Install dependencies: `npm install socket.io-client`
