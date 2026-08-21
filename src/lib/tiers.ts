export function tiers() {
  return [
    { id: 1, name: "Starter", min: 10, profit: 3.5, icon: "fa-seedling" },
    { id: 2, name: "Basic", min: 51, profit: 3.0, icon: "fa-coins" },
    { id: 3, name: "Standard", min: 101, profit: 2.75, icon: "fa-crown" },
    { id: 4, name: "Advanced", min: 301, profit: 2.5, icon: "fa-gem" },
    { id: 5, name: "Premium", min: 501, profit: 2.25, icon: "fa-diamond" },
    { id: 6, name: "Elite", min: 1001, profit: 2.0, icon: "fa-shuttle-space" },
    { id: 7, name: "VIP", min: 2001, profit: 1.75, icon: "fa-fire-flame-curved" },
  ];
}

export function calculateTier(balance: number) {
  let current = 0;
  for (const tier of tiers()) {
    if (balance >= tier.min) current = tier.id;
  }
  return current;
}
