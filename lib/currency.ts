export const getCurrencySymbol = (currencyCode: string): string => {
    switch (currencyCode) {
        case 'USD':
            return '$';
        case 'PKR':
            return '₨';
        case 'SAR':
            return 'SR';
        default:
            return '₹'; // Default to rupee symbol
    }
};