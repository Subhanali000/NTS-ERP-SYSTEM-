import jsPDF from 'jspdf';
import { User } from '../types';
import { formatDate } from './dateUtils';

// ✅ Utility: Generate and return a blob
const downloadPDF = (doc: jsPDF, filename: string) => {
  const safeFilename = filename.replace(/\s+/g, '-').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
};

// ✅ Offer Letter
export const generateOfferLetter = (user: User, position: string, salary: string): void => {
  if (!user?.name || !user?.department) {
    console.error('❌ Missing user data for offer letter');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(20).text('NTS Technologies', 20, 30);
  doc.setFontSize(16).text('Offer Letter', 20, 45);
  doc.setFontSize(12).text(`Date: ${formatDate(new Date())}`, 20, 65);
  doc.text(`Dear ${user.name},`, 20, 85);

  const lines = [
    `We are pleased to offer you the position of ${position} at NTS Technologies.`,
    '',
    'Position Details:',
    `• Position: ${position}`,
    `• Department: ${user.department?.toUpperCase()}`,
    `• Salary: ${salary}`,
    `• Start Date: ${formatDate(new Date())}`,
    '',
    'We look forward to having you join our team.',
    '',
    'Sincerely,',
    'HR Department',
    'NTS Technologies',
  ];

  let y = 105;
  lines.forEach((line) => doc.text(line, 20, y += 15));

  downloadPDF(doc, `Offer_Letter_${user.name}`);
};

// ✅ Experience Certificate
export const generateExperienceCertificate = (user: User): void => {
  if (!user?.name || !user?.role || !user?.department || !user?.joinDate) {
    console.error('❌ Missing user data for experience certificate');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(20).text('NTS Technologies', 20, 30);
  doc.setFontSize(16).text('Experience Certificate', 20, 45);
  doc.setFontSize(12).text(`Date: ${formatDate(new Date())}`, 20, 65);
  doc.text('TO WHOM IT MAY CONCERN', 20, 85);

  const lines = [
    '',
    `This is to certify that ${user.name} was employed with NTS Technologies`,
    `from ${formatDate(user.joinDate)} to ${formatDate(new Date())}.`,
    '',
    `${user.name} worked as ${user.role.replace('_', ' ').toUpperCase()} in the ${user.department.toUpperCase()} department.`,
    '',
    `${user.name} has been a valuable team member and contributed significantly.`,
    '',
    'We wish them all the best for future endeavors.',
    '',
    'Sincerely,',
    'HR Department',
    'NTS Technologies',
  ];

  let y = 105;
  lines.forEach((line) => doc.text(line, 20, y += 15));

  downloadPDF(doc, `Experience_Certificate_${user.name}`);
};

// ✅ Letter of Recommendation
export const generateLOR = (user: User, recommenderName: string): void => {
  if (!user?.name || !user?.joinDate) {
    console.error('❌ Missing user data for letter of recommendation');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(20).text('NTS Technologies', 20, 30);
  doc.setFontSize(16).text('Letter of Recommendation', 20, 45);
  doc.setFontSize(12).text(`Date: ${formatDate(new Date())}`, 20, 65);
  doc.text('TO WHOM IT MAY CONCERN', 20, 85);

  const lines = [
    '',
    `I am writing to recommend ${user.name}, who worked under my supervision`,
    `at NTS Technologies from ${formatDate(user.joinDate)} to ${formatDate(new Date())}.`,
    '',
    `${user.name} demonstrated exceptional skills and dedication.`,
    'They were reliable, professional, and contributed to our success.',
    '',
    `I highly recommend ${user.name} for any future opportunities.`,
    '',
    'Sincerely,',
    recommenderName,
    'NTS Technologies',
  ];

  let y = 105;
  lines.forEach((line) => doc.text(line, 20, y += 15));

  downloadPDF(doc, `Letter_Of_Recommendation_${user.name}`);
};

// ✅ Internship Certificate
export const generateInternshipCertificate = (user: User): void => {
  if (!user?.name || !user?.joinDate || !user?.department) {
    console.error('❌ Missing user data for internship certificate');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(20).text('NTS Technologies', 20, 30);
  doc.setFontSize(16).text('Internship Completion Certificate', 20, 45);
  doc.setFontSize(12).text(`Date: ${formatDate(new Date())}`, 20, 65);
  doc.text('CERTIFICATE OF COMPLETION', 20, 85);

  const lines = [
    '',
    `This is to certify that ${user.name} has successfully completed`,
    `an internship at NTS Technologies from ${formatDate(user.joinDate)}`,
    `to ${formatDate(new Date())}.`,
    '',
    `During this period, ${user.name} worked in the ${user.department.toUpperCase()} department.`,
    'They demonstrated excellent learning capabilities and professional conduct.',
    '',
    'We wish them success in their future career.',
    '',
    'Sincerely,',
    'HR Department',
    'NTS Technologies',
  ];

  let y = 105;
  lines.forEach((line) => doc.text(line, 20, y += 15));

  downloadPDF(doc, `Internship_Certificate_${user.name}`);
};
