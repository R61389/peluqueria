import { Injectable } from '@angular/core';
import { FaceAnalysisResult } from '../models/face-analysis.model';
import {
  ColorimetryResult,
  ColorSeason,
  ColorPalette,
  MetalType,
} from '../models/colorimetry.model';

interface SeasonData {
  subType: string;
  recommendedPalette: ColorPalette;
  avoidPalette: ColorPalette;
  neutralColors: string[];
  accentColors: string[];
  idealMetals: MetalType[];
  characteristics: string[];
}

@Injectable({ providedIn: 'root' })
export class ColorimetryService {
  private seasonData: Record<ColorSeason, SeasonData> = {
    spring: {
      subType: 'Warm Spring',
      recommendedPalette: {
        name: 'Spring Warmth',
        colors: [
          '#F4A460', '#FFD700', '#90EE90', '#FF7F50', '#FFDAB9',
          '#FFA07A', '#98FB98', '#F0E68C', '#DDA0DD', '#87CEEB',
        ],
        description: 'Warm, clear, and light colors that reflect the freshness of spring',
      },
      avoidPalette: {
        name: 'Spring Avoid',
        colors: ['#000000', '#808080', '#800000', '#000080', '#4B0082'],
        description: 'Dark, cool, and muted tones that overpower spring coloring',
      },
      neutralColors: ['#F5F5DC', '#FAEBD7', '#FFF8DC', '#FFFAF0'],
      accentColors: ['#FF6347', '#FF8C00', '#32CD32', '#00CED1'],
      idealMetals: ['gold', 'rose-gold'],
      characteristics: [
        'Clear and warm complexion',
        'Golden or peachy undertones',
        'Light to medium skin tone',
        'Bright and lively overall appearance',
        'Hair often golden blonde or warm brown',
      ],
    },
    summer: {
      subType: 'Cool Summer',
      recommendedPalette: {
        name: 'Summer Softness',
        colors: [
          '#B0C4DE', '#DDA0DD', '#E6E6FA', '#FFB6C1', '#B0E0E6',
          '#AFEEEE', '#D8BFD8', '#C0D0E0', '#F8BBD9', '#A8C5DA',
        ],
        description: 'Soft, cool, and muted colors that complement summer coloring',
      },
      avoidPalette: {
        name: 'Summer Avoid',
        colors: ['#FF4500', '#FFD700', '#FF6347', '#8B4513', '#FF8C00'],
        description: 'Warm, vibrant, and earthy tones that clash with summer coloring',
      },
      neutralColors: ['#F0F0F5', '#E8E8F0', '#DCDCDC', '#F5F5F5'],
      accentColors: ['#6495ED', '#9370DB', '#20B2AA', '#DB7093'],
      idealMetals: ['silver', 'rose-gold'],
      characteristics: [
        'Cool and delicate complexion',
        'Pink or blue undertones',
        'Light to medium skin tone',
        'Soft and muted overall appearance',
        'Hair often ash blonde or cool brown',
      ],
    },
    autumn: {
      subType: 'Deep Autumn',
      recommendedPalette: {
        name: 'Autumn Richness',
        colors: [
          '#8B4513', '#D2691E', '#CD853F', '#A0522D', '#B8860B',
          '#DAA520', '#6B8E23', '#8FBC8F', '#BDB76B', '#D4A017',
        ],
        description: 'Rich, warm, and deep earthy tones that mirror autumn foliage',
      },
      avoidPalette: {
        name: 'Autumn Avoid',
        colors: ['#000080', '#FF69B4', '#00FFFF', '#E6E6FA', '#C0C0C0'],
        description: 'Cool, pastel, and icy tones that look harsh against autumn coloring',
      },
      neutralColors: ['#F5DEB3', '#DEB887', '#D2B48C', '#C4A882'],
      accentColors: ['#FF6633', '#CC5500', '#228B22', '#704214'],
      idealMetals: ['gold', 'rose-gold'],
      characteristics: [
        'Warm and rich complexion',
        'Golden or olive undertones',
        'Medium to dark skin tone',
        'Deep and muted overall appearance',
        'Hair often rich brown, auburn, or dark',
      ],
    },
    winter: {
      subType: 'True Winter',
      recommendedPalette: {
        name: 'Winter Clarity',
        colors: [
          '#FFFFFF', '#000000', '#FF0000', '#0000FF', '#800080',
          '#00008B', '#8B0000', '#006400', '#4B0082', '#DC143C',
        ],
        description: 'Pure, cool, and high-contrast colors that match winter intensity',
      },
      avoidPalette: {
        name: 'Winter Avoid',
        colors: ['#F4A460', '#FFD700', '#DEB887', '#F5DEB3', '#FAEBD7'],
        description: 'Warm, muted, and earthy tones that dilute winter coloring',
      },
      neutralColors: ['#F0F0F0', '#E8E8E8', '#1C1C1C', '#2F2F2F'],
      accentColors: ['#FF1493', '#00FFFF', '#7B68EE', '#FF4500'],
      idealMetals: ['silver', 'mixed'],
      characteristics: [
        'Cool and high-contrast complexion',
        'Blue or pink undertones',
        'Light or very dark skin tone',
        'Clear and dramatic overall appearance',
        'Hair often dark brown, black, or stark platinum',
      ],
    },
  };

  analyze(faceAnalysis: FaceAnalysisResult): ColorimetryResult {
    const season = this.determineSeason(faceAnalysis);
    const confidence = this.calculateConfidence(faceAnalysis, season);
    const data = this.seasonData[season];

    return {
      dominantSeason: season,
      seasonConfidence: confidence,
      subType: data.subType,
      recommendedPalette: data.recommendedPalette,
      avoidPalette: data.avoidPalette,
      neutralColors: data.neutralColors,
      accentColors: data.accentColors,
      idealMetals: data.idealMetals,
      characteristics: data.characteristics,
    };
  }

  private determineSeason(analysis: FaceAnalysisResult): ColorSeason {
    const { skinUndertone, skinTone, facialContrast } = analysis;
    const isWarm = skinUndertone === 'warm';
    const isCool = skinUndertone === 'cool';
    const isLight =
      skinTone === 'very-fair' || skinTone === 'fair' || skinTone === 'medium';
    const isDark = skinTone === 'olive' || skinTone === 'tan' || skinTone === 'dark' || skinTone === 'very-dark';
    const isHighContrast = facialContrast === 'high';

    if (isWarm && isLight) return 'spring';
    if (isCool && isLight) return 'summer';
    if (isWarm && isDark) return 'autumn';
    if (isCool && isDark) return 'winter';
    if (isHighContrast && isDark) return 'winter';
    if (isWarm) return 'autumn';
    if (isCool) return 'summer';
    return 'spring';
  }

  private calculateConfidence(analysis: FaceAnalysisResult, season: ColorSeason): number {
    let confidence = 0.65;
    const { skinUndertone, facialContrast, skinTone } = analysis;

    if (season === 'spring' && skinUndertone === 'warm') confidence += 0.15;
    if (season === 'summer' && skinUndertone === 'cool') confidence += 0.15;
    if (season === 'autumn' && skinUndertone === 'warm') confidence += 0.15;
    if (season === 'winter' && skinUndertone === 'cool') confidence += 0.15;
    if (season === 'winter' && facialContrast === 'high') confidence += 0.1;
    if (
      season === 'spring' &&
      (skinTone === 'very-fair' || skinTone === 'fair')
    )
      confidence += 0.05;

    return Math.min(confidence, 0.95);
  }
}
