// Fix for React 19 + React Native JSX type compatibility
// This file patches the JSX.Element types to work with both React 19 and React Native

import 'react';

declare module 'react' {
    // Patch JSX namespace for React Native compatibility
    namespace JSX {
        interface Element extends React.ReactElement<any, any> { }
        interface ElementClass extends React.Component<any> {
            render(): React.ReactNode;
        }
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
        interface IntrinsicAttributes extends React.Attributes { }
        interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
    }
}

// Ensure expo-router exports are recognized
declare module 'expo-router' {
    export const Link: React.ComponentType<any>;
    export const Tabs: any;
    export const Stack: any;
    export function useRouter(): {
        push: (href: string) => void;
        replace: (href: string) => void;
        back: () => void;
        canGoBack: () => boolean;
    };
    export function useLocalSearchParams<T = Record<string, string>>(): T;
    export function useSegments(): string[];
    export function usePathname(): string;
}
