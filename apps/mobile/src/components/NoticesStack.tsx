import { ActivityIndicator, StyleSheet } from 'react-native';
import { InlineNotice, type NoticeVariant } from './InlineNotice';

export interface NoticeItem {
  key: string;
  message: string;
  variant?: NoticeVariant;
  testID?: string;
}

interface NoticesStackProps {
  notices: Array<NoticeItem | null | undefined | false>;
  showLoading?: boolean;
  loadingColor?: string;
}

export function NoticesStack({
  notices,
  showLoading = false,
  loadingColor = '#1F8E46',
}: NoticesStackProps) {
  return (
    <>
      {notices.map((notice) =>
        notice ? (
          <InlineNotice key={notice.key} variant={notice.variant} testID={notice.testID}>
            {notice.message}
          </InlineNotice>
        ) : null,
      )}
      {showLoading && <ActivityIndicator color={loadingColor} style={styles.loading} />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 10,
  },
});
