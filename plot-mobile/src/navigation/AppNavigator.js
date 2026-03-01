import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../hooks/useGameSocket';

// Import Screens
import { RoleSelectScreen } from '../screens/RoleSelectScreen';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
import { TrainingRoleSelectScreen, TrainingJoinScreen } from '../screens/TrainingScreens';
import { HostSetupScreen, HostLobbyScreen } from '../screens/HostScreens';
import { HostGameIntroScreen, HostDraftingScreen, HostVotingScreen, HostResultsScreen, HostDramaticRevealScreen } from '../screens/HostGameScreens';
import { DiscussionScreen } from '../screens/DiscussionScreen';
import { LoginScreen, LobbyScreen } from '../screens/PlayerScreens';
import { GameScreen, DraftingScreen } from '../screens/GameScreens';
import { QualityVotingScreen, CulpritVotingScreen, WaitingRevealScreen, EndScreen, PlayerDramaticRevealScreen, PlayerResultsScreen } from '../screens/VotingScreens';
import { ShowcaseScreen } from '../screens/ShowcaseScreen';

import { useGameStore } from '../store/useGameStore';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const roundResults = useGameStore((state) => state.roundResults);

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.ROLE_SELECT}
            screenOptions={{
                headerShown: false,
                animation: 'fade', // Optional: customize transitions
            }}
        >
            <Stack.Screen name={ROUTES.ROLE_SELECT} component={RoleSelectScreen} />
            <Stack.Screen name={ROUTES.HOW_TO_PLAY} component={HowToPlayScreen} />

            {/* Training Screens */}
            <Stack.Screen name={ROUTES.TRAINING_ROLE_SELECT} component={TrainingRoleSelectScreen} />
            <Stack.Screen name={ROUTES.TRAINING_JOIN} component={TrainingJoinScreen} />

            {/* Host Screens */}
            <Stack.Screen name={ROUTES.HOST_SETUP} component={HostSetupScreen} />
            <Stack.Screen name={ROUTES.HOST_LOBBY} component={HostLobbyScreen} />
            <Stack.Screen name={ROUTES.HOST_GAME_INTRO} component={HostGameIntroScreen} />
            <Stack.Screen name={ROUTES.HOST_DRAFTING} component={HostDraftingScreen} />
            <Stack.Screen name={ROUTES.HOST_QUALITY_VOTING}>
                {() => <HostVotingScreen votingType="quality" />}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.HOST_DRAMATIC_REVEAL} component={HostDramaticRevealScreen} />
            <Stack.Screen name={ROUTES.HOST_DISCUSSION}>
                {() => <DiscussionScreen isHost={true} />}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.HOST_CULPRIT_VOTING}>
                {() => <HostVotingScreen votingType="culprit" />}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.HOST_RESULTS}>
                {() => <HostResultsScreen />}
            </Stack.Screen>

            {/* Player Screens */}
            <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
            <Stack.Screen name={ROUTES.LOBBY} component={LobbyScreen} />
            <Stack.Screen name={ROUTES.GAME} component={GameScreen} />
            <Stack.Screen name={ROUTES.DRAFTING} component={DraftingScreen} />
            <Stack.Screen name={ROUTES.QUALITY_VOTING} component={QualityVotingScreen} />
            <Stack.Screen name={ROUTES.PLAYER_DRAMATIC_REVEAL} component={PlayerDramaticRevealScreen} />
            <Stack.Screen name={ROUTES.DISCUSSION}>
                {() => <DiscussionScreen isHost={false} />}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.CULPRIT_VOTING} component={CulpritVotingScreen} />

            {/* Shared/Dynamic Screens */}
            <Stack.Screen name={ROUTES.WAITING}>
                {(props) => roundResults ? <PlayerResultsScreen {...props} /> : <WaitingRevealScreen {...props} />}
            </Stack.Screen>

            <Stack.Screen name={ROUTES.END} component={EndScreen} />
            <Stack.Screen name={ROUTES.SHOWCASE} component={ShowcaseScreen} />
        </Stack.Navigator>
    );
};
