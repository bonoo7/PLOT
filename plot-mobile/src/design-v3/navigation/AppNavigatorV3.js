import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../hooks/useGameSocket';
import { useGameStore } from '../../store/useGameStore';
import { DiscussionScreen } from '../screens/DiscussionScreen';
import { DraftingScreen } from '../screens/DraftingScreen';
import { GameScreen } from '../screens/GameScreen';
import { HostGameIntroScreen, HostDraftingScreen, HostVotingScreen, HostResultsScreen, HostDramaticRevealScreen } from '../screens/HostGameScreens';
import { HostSetupScreen, HostLobbyScreen } from '../screens/HostScreens';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
import { LoginScreen, LobbyScreen } from '../screens/PlayerScreens';
import { RoleSelectScreen } from '../screens/RoleSelectScreen';
import { TrainingJoinScreen, TrainingRoleSelectScreen } from '../screens/TrainingScreens';
import { CulpritVotingScreen, EndScreen, PlayerDramaticRevealScreen, PlayerResultsScreen, QualityVotingScreen, WaitingRevealScreen } from '../screens/VotingScreens';

const Stack = createNativeStackNavigator();

export const AppNavigatorV3 = () => {
  const roundResults = useGameStore((s) => s.roundResults);

  return (
    <Stack.Navigator initialRouteName={ROUTES.ROLE_SELECT} screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name={ROUTES.ROLE_SELECT} component={RoleSelectScreen} />
      <Stack.Screen name={ROUTES.HOW_TO_PLAY} component={HowToPlayScreen} />
      <Stack.Screen name={ROUTES.TRAINING_ROLE_SELECT} component={TrainingRoleSelectScreen} />
      <Stack.Screen name={ROUTES.TRAINING_JOIN} component={TrainingJoinScreen} />
      <Stack.Screen name={ROUTES.HOST_SETUP} component={HostSetupScreen} />
      <Stack.Screen name={ROUTES.HOST_LOBBY} component={HostLobbyScreen} />
      <Stack.Screen name={ROUTES.HOST_GAME_INTRO} component={HostGameIntroScreen} />
      <Stack.Screen name={ROUTES.HOST_DRAFTING} component={HostDraftingScreen} />
      <Stack.Screen name={ROUTES.HOST_QUALITY_VOTING}>{() => <HostVotingScreen route={{ params: { votingType: 'quality' } }} />}</Stack.Screen>
      <Stack.Screen name={ROUTES.HOST_DRAMATIC_REVEAL} component={HostDramaticRevealScreen} />
      <Stack.Screen name={ROUTES.HOST_DISCUSSION}>{() => <DiscussionScreen isHost={true} />}</Stack.Screen>
      <Stack.Screen name={ROUTES.HOST_CULPRIT_VOTING}>{() => <HostVotingScreen route={{ params: { votingType: 'culprit' } }} />}</Stack.Screen>
      <Stack.Screen name={ROUTES.HOST_RESULTS} component={HostResultsScreen} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.LOBBY} component={LobbyScreen} />
      <Stack.Screen name={ROUTES.GAME} component={GameScreen} />
      <Stack.Screen name={ROUTES.DRAFTING} component={DraftingScreen} />
      <Stack.Screen name={ROUTES.QUALITY_VOTING} component={QualityVotingScreen} />
      <Stack.Screen name={ROUTES.PLAYER_DRAMATIC_REVEAL} component={PlayerDramaticRevealScreen} />
      <Stack.Screen name={ROUTES.DISCUSSION}>{() => <DiscussionScreen isHost={false} />}</Stack.Screen>
      <Stack.Screen name={ROUTES.CULPRIT_VOTING} component={CulpritVotingScreen} />
      <Stack.Screen name={ROUTES.WAITING}>{(props) => (roundResults ? <PlayerResultsScreen {...props} /> : <WaitingRevealScreen {...props} />)}</Stack.Screen>
      <Stack.Screen name={ROUTES.END} component={EndScreen} />
    </Stack.Navigator>
  );
};
