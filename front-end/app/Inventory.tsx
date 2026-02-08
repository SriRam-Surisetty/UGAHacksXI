import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import AuthHeader from '@/components/auth-header';

export default function Inventory() {
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="dark" />
			<AuthHeader activeRoute="/Inventory" />
			<View style={styles.content}>
				<Text style={styles.title}>Inventory</Text>
				<Text style={styles.subtitle}>Inventory detail views will land here next.</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.landing.white,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: Colors.landing.black,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: '#4a4a4a',
		textAlign: 'center',
	},
});
