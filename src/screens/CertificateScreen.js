import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle, Ellipse, Path, G, Defs, RadialGradient, Stop,
  Rect, Line, Polygon,
} from 'react-native-svg';
import { SPACING, RADIUS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetCertificate } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// ── Floral SVG Decoration ─────────────────────────────────────────────────────

function Petal({ cx, cy, rx, ry, rotation, color }) {
  return (
    <Ellipse
      cx={cx} cy={cy} rx={rx} ry={ry}
      fill={color}
      transform={`rotate(${rotation}, ${cx}, ${cy})`}
      opacity={0.82}
    />
  );
}

function Flower({ x, y, size, colors }) {
  const petalCount = 6;
  const petalRy = size * 0.42;
  const petalRx = size * 0.18;
  const offset = size * 0.28;
  return (
    <G>
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = (360 / petalCount) * i;
        const rad = (angle * Math.PI) / 180;
        const cx = x + Math.cos(rad) * offset;
        const cy = y + Math.sin(rad) * offset;
        return (
          <Petal
            key={i}
            cx={cx} cy={cy}
            rx={petalRx} ry={petalRy}
            rotation={angle + 90}
            color={colors[i % colors.length]}
          />
        );
      })}
      <Circle cx={x} cy={y} r={size * 0.2} fill="#FFD700" opacity={0.95} />
      <Circle cx={x} cy={y} r={size * 0.1} fill="#FFF8DC" opacity={1} />
    </G>
  );
}

function Leaf({ x, y, size, rotation, color }) {
  const d = `M ${x} ${y - size} Q ${x + size * 0.5} ${y} ${x} ${y + size} Q ${x - size * 0.5} ${y} ${x} ${y - size}`;
  return (
    <Path
      d={d}
      fill={color}
      opacity={0.7}
      transform={`rotate(${rotation}, ${x}, ${y})`}
    />
  );
}

function FloralCorner({ x, y, mirror, flip }) {
  const tx = mirror ? -1 : 1;
  const ty = flip ? -1 : 1;
  const ox = mirror ? x * 2 : 0;
  const oy = flip ? y * 2 : 0;

  return (
    <G transform={`scale(${tx}, ${ty}) translate(${ox > 0 ? -ox : 0}, ${oy > 0 ? -oy : 0})`}>
      {/* Branch curves */}
      <Path
        d={`M ${x + 10} ${y + 10} Q ${x + 40} ${y + 20} ${x + 60} ${y + 55}`}
        stroke="#4CAF50" strokeWidth={2.2} fill="none" opacity={0.6}
        strokeLinecap="round"
      />
      <Path
        d={`M ${x + 10} ${y + 10} Q ${x + 20} ${y + 40} ${x + 55} ${y + 60}`}
        stroke="#4CAF50" strokeWidth={2.2} fill="none" opacity={0.6}
        strokeLinecap="round"
      />
      <Path
        d={`M ${x + 25} ${y + 14} Q ${x + 35} ${y + 8} ${x + 50} ${y + 18}`}
        stroke="#66BB6A" strokeWidth={1.5} fill="none" opacity={0.5}
        strokeLinecap="round"
      />

      {/* Leaves */}
      <Leaf x={x + 55} y={y + 55} size={14} rotation={-40} color="#66BB6A" />
      <Leaf x={x + 40} y={y + 25} size={10} rotation={30} color="#81C784" />
      <Leaf x={x + 20} y={y + 45} size={11} rotation={-60} color="#A5D6A7" />
      <Leaf x={x + 50} y={y + 35} size={8} rotation={10} color="#4CAF50" />

      {/* Flowers */}
      <Flower x={x + 62} y={y + 18} size={14} colors={['#FF8A80', '#FF6B9D', '#FF80AB', '#F06292']} />
      <Flower x={x + 18} y={y + 65} size={12} colors={['#80DEEA', '#4DD0E1', '#00BCD4', '#26C6DA']} />
      <Flower x={x + 50} y={y + 68} size={10} colors={['#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0']} />
      <Flower x={x + 70} y={y + 50} size={9} colors={['#FFCC80', '#FFB74D', '#FFA726', '#FF9800']} />

      {/* Small dots */}
      <Circle cx={x + 35} cy={y + 60} r={3} fill="#FF8A80" opacity={0.8} />
      <Circle cx={x + 55} cy={y + 15} r={2.5} fill="#80DEEA" opacity={0.8} />
      <Circle cx={x + 68} cy={y + 35} r={2} fill="#CE93D8" opacity={0.8} />
    </G>
  );
}

function CertificateSVGBackground({ width, height }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="bgGrad" cx="50%" cy="50%" rx="70%" ry="70%">
          <Stop offset="0%" stopColor="#FFFEF7" />
          <Stop offset="100%" stopColor="#FFF8E1" />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#bgGrad)" />

      {/* Outer decorative border */}
      <Rect x={10} y={10} width={width - 20} height={height - 20}
        stroke="#D4AF37" strokeWidth={2} fill="none" rx={12} />
      <Rect x={16} y={16} width={width - 32} height={height - 32}
        stroke="#D4AF37" strokeWidth={0.7} fill="none" rx={10} opacity={0.5} />

      {/* Corner florals - Top Left */}
      <FloralCorner x={18} y={18} mirror={false} flip={false} />

      {/* Corner florals - Top Right (mirrored) */}
      <G transform={`translate(${width}, 0) scale(-1, 1)`}>
        <FloralCorner x={18} y={18} mirror={false} flip={false} />
      </G>

      {/* Corner florals - Bottom Left (flipped) */}
      <G transform={`translate(0, ${height}) scale(1, -1)`}>
        <FloralCorner x={18} y={18} mirror={false} flip={false} />
      </G>

      {/* Corner florals - Bottom Right (both mirrored) */}
      <G transform={`translate(${width}, ${height}) scale(-1, -1)`}>
        <FloralCorner x={18} y={18} mirror={false} flip={false} />
      </G>

      {/* Side small flowers */}
      <Flower x={width / 2} y={18} size={10} colors={['#FF8A80', '#CE93D8', '#80DEEA', '#FFCC80', '#A5D6A7']} />
      <Flower x={width / 2} y={height - 18} size={10} colors={['#FF8A80', '#CE93D8', '#80DEEA', '#FFCC80', '#A5D6A7']} />
      <Flower x={18} y={height / 2} size={10} colors={['#FF80AB', '#80CBC4', '#FFCC80', '#CE93D8', '#A5D6A7']} />
      <Flower x={width - 18} y={height / 2} size={10} colors={['#FF80AB', '#80CBC4', '#FFCC80', '#CE93D8', '#A5D6A7']} />

      {/* Subtle center watermark ring */}
      <Circle cx={width / 2} cy={height / 2} r={80} stroke="#D4AF37" strokeWidth={0.5} fill="none" opacity={0.3} />
      <Circle cx={width / 2} cy={height / 2} r={85} stroke="#D4AF37" strokeWidth={0.3} fill="none" opacity={0.2} />
    </Svg>
  );
}

function SealSVG({ size = 64 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="sealGrad" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#B8860B" />
        </RadialGradient>
      </Defs>
      {/* Star burst */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (360 / 16) * i * (Math.PI / 180);
        const x1 = 32 + Math.cos(angle) * 28;
        const y1 = 32 + Math.sin(angle) * 28;
        const x2 = 32 + Math.cos(angle) * 22;
        const y2 = 32 + Math.sin(angle) * 22;
        return <Line key={i} x1={32} y1={32} x2={x1} y2={y1} stroke="#D4AF37" strokeWidth={1.5} opacity={0.5} />;
      })}
      <Circle cx={32} cy={32} r={22} fill="url(#sealGrad)" />
      <Circle cx={32} cy={32} r={19} stroke="#FFF8DC" strokeWidth={1.5} fill="none" />
      <Circle cx={32} cy={32} r={16} fill="#D4AF37" opacity={0.3} />
      {/* Checkmark */}
      <Path d="M 22 32 L 28 38 L 42 24" stroke="#FFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CertificateScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const { certificate: certParam, courseId: courseIdParam } = route.params || {};
  const { user } = useAuth();

  const [certificate, setCertificate] = useState(certParam || null);
  const [loading, setLoading]         = useState(!certParam && !!courseIdParam);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (!certParam && courseIdParam) {
      apiGetCertificate(courseIdParam)
        .then(res => {
          const cert = res.data?.certificate;
          if (cert) setCertificate(cert);
          else setError('Certificate not found. Make sure you completed the course.');
        })
        .catch(() => setError('Certificate not found. Make sure you completed the course.'))
        .finally(() => setLoading(false));
    }
  }, [courseIdParam]);

  const studentName   = certificate?.user
    ? `${certificate.user.firstName} ${certificate.user.lastName}`.trim()
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
  const courseTitle   = certificate?.course?.title    || 'Course';
  const courseCode    = certificate?.course?.code     || '';
  const instructorName = certificate?.course?.creator
    ? `${certificate.course.creator.firstName} ${certificate.course.creator.lastName}`.trim()
    : 'Instructor';
  const issuedDate    = certificate?.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const certId        = certificate?.id?.slice(0, 8)?.toUpperCase() || '';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I completed "${courseTitle}" on iLearn! Certificate issued on ${issuedDate}.`,
        title: 'My iLearn Certificate',
      });
    } catch (_) {}
  };

  const handleDownloadPDF = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      handleShare();
    }
  };

  const handleDownloadJPG = () => {
    if (Platform.OS === 'web') {
      // Convert the certificate SVG area to canvas and download as JPEG
      const svgEl = document.querySelector('#cert-svg');
      if (!svgEl) { handleShare(); return; }
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas  = document.createElement('canvas');
      canvas.width  = 800;
      canvas.height = 560;
      const ctx     = canvas.getContext('2d');
      const img     = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link    = document.createElement('a');
        link.download = `mathaino-certificate-${certId}.jpg`;
        link.href     = canvas.toDataURL('image/jpeg', 0.92);
        link.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } else {
      handleShare();
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#F5F5F5' },
    loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText:  { fontSize: 14, color: '#888' },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    errorTitle:   { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 16 },
    errorText:    { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 },

    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: SPACING.xl, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
      backgroundColor: '#fff',
    },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center' },

    scroll: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },

    certCard: {
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },

    certContent: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 24,
    },

    orgName: { fontSize: 11, fontWeight: '800', color: '#B8860B', letterSpacing: 4, textTransform: 'uppercase' },
    orgSub:  { fontSize: 8,  color: '#999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },

    sealWrap: { marginVertical: 8 },

    certTitle:    { fontSize: 18, fontWeight: '900', color: '#B8860B', letterSpacing: 3, textTransform: 'uppercase' },
    certSubtitle: { fontSize: 9,  color: '#B8860B', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },

    dividerGold: { width: 120, height: 1.5, backgroundColor: '#D4AF37', marginVertical: 12, opacity: 0.7 },

    presentsLabel: { fontSize: 9, color: '#888', textAlign: 'center', marginBottom: 4, letterSpacing: 0.5 },
    studentName:   { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 6, fontStyle: 'italic' },
    courseName:    { fontSize: 12, fontWeight: '700', color: '#B8860B', textAlign: 'center', marginTop: 4 },
    courseCode:    { fontSize: 9,  color: '#999', textAlign: 'center', marginTop: 2 },

    certFooter: { flexDirection: 'row', gap: 24, marginTop: 4 },
    footerCol:  { alignItems: 'center' },
    footerVal:  { fontSize: 9, fontWeight: '700', color: '#333', textAlign: 'center', maxWidth: 90 },
    footerLine: { width: 70, height: 0.8, backgroundColor: '#B8860B', marginVertical: 3, opacity: 0.6 },
    footerLabel: { fontSize: 7, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },

    certId: { fontSize: 7, color: '#BBB', marginTop: 8, letterSpacing: 1 },

    verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
    verifyText: { fontSize: 11, color: '#888' },

    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: COLORS.accent,
      paddingVertical: 12, paddingHorizontal: 20,
      borderRadius: RADIUS.lg,
    },
    actionBtnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5, borderColor: COLORS.accent,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  }), [COLORS]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading certificate…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !certificate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certificate</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="ribbon-outline" size={56} color="#ccc" />
          <Text style={styles.errorTitle}>No Certificate Yet</Text>
          <Text style={styles.errorText}>{error || 'Complete the course to earn your certificate.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const CERT_W = 340;
  const CERT_H = 480;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Certificate card */}
        <View style={[styles.certCard, { width: CERT_W, height: CERT_H }]}>
          <CertificateSVGBackground width={CERT_W} height={CERT_H} />

          {/* Content on top of SVG */}
          <View style={styles.certContent}>
            {/* Org name */}
            <Text style={styles.orgName}>MATHAINO</Text>
            <Text style={styles.orgSub}>Learning Platform</Text>

            {/* Seal */}
            <View style={styles.sealWrap}>
              <SealSVG size={58} />
            </View>

            {/* Title */}
            <Text style={styles.certTitle}>CERTIFICATE</Text>
            <Text style={styles.certSubtitle}>OF COMPLETION</Text>

            <View style={styles.dividerGold} />

            <Text style={styles.presentsLabel}>This is to certify that</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.presentsLabel}>has successfully completed</Text>
            <Text style={styles.courseName}>{courseTitle}</Text>
            {courseCode ? <Text style={styles.courseCode}>{courseCode}</Text> : null}

            <View style={styles.dividerGold} />

            {/* Footer */}
            <View style={styles.certFooter}>
              <View style={styles.footerCol}>
                <Text style={styles.footerVal}>{issuedDate}</Text>
                <View style={styles.footerLine} />
                <Text style={styles.footerLabel}>Date Issued</Text>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerVal}>{instructorName}</Text>
                <View style={styles.footerLine} />
                <Text style={styles.footerLabel}>Instructor</Text>
              </View>
            </View>

            {certId ? (
              <Text style={styles.certId}>Certificate ID: {certId}</Text>
            ) : null}
          </View>
        </View>

        {/* Verification row */}
        <View style={styles.verifyRow}>
          <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
          <Text style={styles.verifyText}>Verified Completion • iLearn</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={handleDownloadPDF}>
            <Ionicons name="document-outline" size={18} color={COLORS.accent} />
            <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={handleDownloadJPG}>
            <Ionicons name="image-outline" size={18} color={COLORS.accent} />
            <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>JPG</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

