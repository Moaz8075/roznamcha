import { Image, type ImageStyle, type StyleProp } from 'react-native';

const logo = require('../../assets/logo.png');

type BrandLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

/** Full business logo (calligraphy + company name). */
export function BrandLogo({ width = 160, height = 118, style }: BrandLogoProps) {
  return (
    <Image
      source={logo}
      accessibilityLabel="Arif Bilal and Son's"
      resizeMode="contain"
      style={[{ width, height }, style]}
    />
  );
}
