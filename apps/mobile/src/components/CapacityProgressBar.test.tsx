import { render } from '@testing-library/react-native';
import { CapacityProgressBar } from './CapacityProgressBar';

describe('CapacityProgressBar', () => {
  it('renders booking readout and width from fullness percentage', () => {
    const { getByText, getByTestId } = render(
      <CapacityProgressBar currentBookings={8} capacityLimit={30} fullnessPercentage={27} />,
    );

    expect(getByText('8/30 (27%)')).toBeTruthy();
    expect(getByTestId('capacity-progress-fill')).toHaveStyle({ width: '27%' });
  });

  it('clamps the fill width between 0 and 100', () => {
    const { getByTestId, rerender } = render(
      <CapacityProgressBar currentBookings={0} capacityLimit={30} fullnessPercentage={-10} />,
    );

    expect(getByTestId('capacity-progress-fill')).toHaveStyle({ width: '0%' });

    rerender(<CapacityProgressBar currentBookings={50} capacityLimit={30} fullnessPercentage={140} />);

    expect(getByTestId('capacity-progress-fill')).toHaveStyle({ width: '100%' });
  });
});
