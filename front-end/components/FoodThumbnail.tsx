import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
	name: string;
	size?: number;
	type?: 'meal' | 'ingredient';
};

const cache = new Map<string, string | null>();

function getIngredientUrl(name: string) {
	return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name.trim())}.png`;
}

export default function FoodThumbnail({ name, size = 36, type = 'meal' }: Props) {
	const ingredientUri = type === 'ingredient' ? getIngredientUrl(name) : null;
	const [uri, setUri] = useState<string | null>(ingredientUri ?? cache.get(name) ?? null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (type === 'ingredient') {
			setUri(getIngredientUrl(name));
			setFailed(false);
			return;
		}

		if (cache.has(name)) {
			setUri(cache.get(name) ?? null);
			return;
		}

		let cancelled = false;
		const term = encodeURIComponent(name.trim());
		fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`)
			.then((res) => res.json())
			.then((data) => {
				if (cancelled) return;
				const thumb = data?.meals?.[0]?.strMealThumb ?? null;
				cache.set(name, thumb);
				setUri(thumb);
			})
			.catch(() => {
				if (!cancelled) {
					cache.set(name, null);
					setUri(null);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [name, type]);

	const borderRadius = size * 0.17;

	if (!uri || failed) {
		return (
			<View style={[styles.placeholder, { width: size, height: size, borderRadius }]}>
				<Ionicons name="fast-food-outline" size={size * 0.5} color="#9ca3af" />
			</View>
		);
	}

	const imageUri = type === 'ingredient' ? uri! : `${uri}/preview`;

	return (
		<Image
			source={{ uri: imageUri }}
			style={[styles.image, { width: size, height: size, borderRadius }]}
			onError={() => setFailed(true)}
		/>
	);
}

const styles = StyleSheet.create({
	image: {
		backgroundColor: '#f3f4f6',
		overflow: 'hidden',
	},
	placeholder: {
		backgroundColor: '#f3f4f6',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
});
