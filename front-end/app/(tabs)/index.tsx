import { Image } from 'expo-image';
import { Platform, StyleSheet, Button, View as NativeView } from 'react-native';
// @ts-ignore
import { useRouter } from 'expo-router';
// @ts-ignore
import { Link } from 'expo-router';
import { useState, useEffect } from 'react';

// Cast View to any to fix strict TS error "JSX element class does not support attributes"
const View = NativeView as any;

import { saveUserId, getUserId, deleteUserId, deleteToken } from '@/services/storage';
import api from '@/services/api';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HelloWave } from '@/components/hello-wave';

export default function HomeScreen() {
  const [message, setMessage] = useState('Loading...');
  const [storedId, setStoredId] = useState<string | null>(null);
  const [protectedData, setProtectedData] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    checkBackend();
    checkUser();
  }, []);

  const checkBackend = () => {
    api.get('/')
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage('Error fetching data: ' + error.message));
  };

  const checkUser = async () => {
    const id = await getUserId();
    setStoredId(id);
  };

  const handleLogout = async () => {
    await deleteUserId();
    await deleteToken();
    setProtectedData('');
    await checkUser();
    alert('Logged out');
  };

  const testProtected = async () => {
    try {
      const response = await api.get('/protected');
      setProtectedData(`Success: ${JSON.stringify(response.data)} `);
    } catch (error: any) {
      setProtectedData(`Error: ${error.response?.status} - ${error.response?.data?.msg || error.message} `);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Backend Status:</ThemedText>
        <ThemedText>{message}</ThemedText>
        <Button title="Refresh Backend" onPress={checkBackend} />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Authentication Test:</ThemedText>
        <ThemedText>Current User: {storedId || 'Not Logged In'}</ThemedText>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button title="Go to Login" onPress={() => router.push('/login')} />
          <Button title="Logout" onPress={handleLogout} color="red" />
        </View>

        <View style={{ marginTop: 10 }}>
          <Button title="Test Protected API" onPress={testProtected} />
          <ThemedText>{protectedData}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText >
      </ThemedView >
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView >
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
