import { Activity, Gauge, Plane, Rocket } from 'lucide-react';

export const categories = [
  {
    id: 'rocket',
    title: 'Roket Sistemleri',
    subtitle: 'Model roket testleri için yörünge, simülasyon ve güvenli alan analizleri.',
    icon: Rocket,
    accent: 'cyan',
  },
  {
    id: 'uav',
    title: 'İHA Sistemleri',
    subtitle: 'Sabit kanat İHA operasyonları için performans ve hazırlık analizleri.',
    icon: Plane,
    accent: 'blue',
  },
];

export const modules = [
  {
    id: 'bayhes',
    categoryId: 'rocket',
    title: 'Balistik Yörünge ve Güvenli Alan Analizi',
    shortTitle: 'BAYHES',
    description:
      'Model roket uçuşlarında tahmini yörünge, maksimum irtifa, uçuş süresi ve düşüş alanı analizi.',
    status: 'Hazır',
    statusTone: 'ready',
    icon: Activity,
    component: 'RocketBayhesModule',
  },
  {
    id: 'performance',
    categoryId: 'uav',
    title: 'Performans Parametreleri',
    shortTitle: 'Performans',
    description:
      'Kalkış ağırlığı, pist uzunluğu ve rüzgar koşullarına göre sabit kanat İHA performans değerlendirmesi.',
    status: 'Hazır',
    statusTone: 'ready',
    icon: Gauge,
    component: 'UavPerformanceModule',
  },
];

export function getCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

export function getModulesByCategory(categoryId) {
  return modules.filter((module) => module.categoryId === categoryId);
}

export function getModule(categoryId, moduleId) {
  return modules.find((module) => module.categoryId === categoryId && module.id === moduleId);
}
