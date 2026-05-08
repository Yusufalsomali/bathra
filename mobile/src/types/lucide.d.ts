import "lucide-react-native";

declare module "lucide-react-native" {
  interface LucideProps {
    stroke?: string;
    color?: string;
    strokeWidth?: number;
    size?: number | string;
    fill?: string;
  }
}
