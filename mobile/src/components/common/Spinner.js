import { View, ActivityIndicator } from "react-native";
import styles from "../../styles/Spinner.styles";

export default function Spinner() {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" />
    </View>
  );
}
