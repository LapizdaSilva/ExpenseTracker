import  React  from 'react'
import { ImageBackground, StyleSheet} from 'react-native';
import type { PropsWithChildren } from 'react';

type FundoProps = PropsWithChildren<{}>;

export default function Fundo({ children }: FundoProps) {
  return (
    <ImageBackground
      source={require('../assets/voamlk.jpg')}
      style={styles.fundo}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
    fundo: {
        flex: 1,
    },
    
})