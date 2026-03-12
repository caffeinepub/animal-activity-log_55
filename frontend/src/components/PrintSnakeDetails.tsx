import { useEffect, useRef } from 'react';
import { calculateAge, formatAge } from '../lib/ageCalculator';
import type { Animal, Meal, PairingEntry, ClutchEntry, ShedEntry, TubChangeEntry, WeightEntry } from '../backend';

interface PrintSnakeDetailsProps {
  animal: Animal;
  meals: Meal[];
  weights: WeightEntry[];
  pairings: PairingEntry[];
  clutches: ClutchEntry[];
  sheds: ShedEntry[];
  tubChanges: TubChangeEntry[];
  onPrintComplete: () => void;
}

export function PrintSnakeDetails({
  animal,
  meals,
  weights,
  pairings,
  clutches,
  sheds,
  tubChanges,
  onPrintComplete,
}: PrintSnakeDetailsProps) {
  const printWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    const age = calculateAge(animal.birthday);
    const sortedMeals = [...meals].sort((a, b) => Number(b.timestamp - a.timestamp));
    const sortedWeights = [...weights].sort((a, b) => Number(b.timestamp - a.timestamp));
    const sortedPairings = [...pairings].sort((a, b) => Number(b.timestamp - a.timestamp));
    const sortedClutches = [...clutches].sort((a, b) => Number(b.timestamp - a.timestamp));
    const sortedSheds = [...sheds].sort((a, b) => Number(b.timestamp - a.timestamp));
    const sortedTubChanges = [...tubChanges].sort((a, b) => Number(b.timestamp - a.timestamp));

    const lastMeal = sortedMeals[0];
    const lastWeight = sortedWeights[0];
    const lastPairing = sortedPairings[0];
    const lastShed = sortedSheds[0];
    const lastTubChange = sortedTubChanges[0];

    const formatDate = (timestamp: bigint) => {
      const date = new Date(Number(timestamp) / 1000000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${animal.name} - Details</title>
          <style>
            @media print {
              @page {
                size: portrait;
                margin: 0.75in;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-controls {
                display: none !important;
              }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
              background: white;
            }
            
            .print-controls {
              display: flex;
              gap: 0.75rem;
              margin-bottom: 1.5rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .print-controls button {
              padding: 0.5rem 1.25rem;
              font-size: 0.875rem;
              font-weight: 600;
              border-radius: 0.375rem;
              border: 1px solid #d1d5db;
              background: white;
              color: #374151;
              cursor: pointer;
              transition: all 0.2s;
              font-family: inherit;
            }
            
            .print-controls button:hover {
              background: #f9fafb;
              border-color: #9ca3af;
            }
            
            .print-controls button:active {
              background: #f3f4f6;
            }
            
            .print-controls button.primary {
              background: #2563eb;
              color: white;
              border-color: #2563eb;
            }
            
            .print-controls button.primary:hover {
              background: #1d4ed8;
              border-color: #1d4ed8;
            }
            
            .print-controls button.primary:active {
              background: #1e40af;
            }
            
            .header {
              text-align: center;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid #2563eb;
            }
            
            .header h1 {
              font-size: 2rem;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 0.5rem;
            }
            
            .header .subtitle {
              font-size: 1rem;
              color: #64748b;
              font-weight: 500;
            }
            
            .section {
              margin-bottom: 2rem;
              page-break-inside: avoid;
            }
            
            .section-title {
              font-size: 1.25rem;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .profile-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
              margin-bottom: 1rem;
            }
            
            .profile-item {
              padding: 0.75rem;
              background: #f8fafc;
              border-radius: 0.375rem;
              border: 1px solid #e2e8f0;
            }
            
            .profile-label {
              font-size: 0.875rem;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.025em;
              margin-bottom: 0.25rem;
            }
            
            .profile-value {
              font-size: 1rem;
              font-weight: 600;
              color: #1a1a1a;
            }
            
            .summary-box {
              background: #eff6ff;
              border: 1px solid #3b82f6;
              border-radius: 0.5rem;
              padding: 1rem;
              margin-bottom: 1rem;
            }
            
            .summary-item {
              display: flex;
              justify-content: space-between;
              padding: 0.5rem 0;
              border-bottom: 1px solid #bfdbfe;
            }
            
            .summary-item:last-child {
              border-bottom: none;
            }
            
            .summary-label {
              font-weight: 600;
              color: #1e40af;
            }
            
            .summary-value {
              font-weight: 700;
              color: #1e3a8a;
            }
            
            .history-list {
              list-style: none;
              margin-top: 0.5rem;
            }
            
            .history-item {
              padding: 0.75rem;
              margin-bottom: 0.5rem;
              background: #f8fafc;
              border-left: 3px solid #3b82f6;
              border-radius: 0.25rem;
            }
            
            .history-date {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 0.25rem;
            }
            
            .history-details {
              color: #475569;
              line-height: 1.5;
            }
            
            .no-data {
              color: #94a3b8;
              font-style: italic;
              padding: 1rem;
              text-align: center;
              background: #f8fafc;
              border-radius: 0.375rem;
            }
            
            .footer {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="print-controls">
            <button type="button" onclick="window.close()">← Back</button>
            <button type="button" class="primary" onclick="window.print()">🖨️ Print</button>
          </div>
          
          <div class="header">
            <h1>${animal.name}</h1>
            <div class="subtitle">Complete Animal Profile & History</div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Profile Information</h2>
            <div class="profile-grid">
              <div class="profile-item">
                <div class="profile-label">ID Number</div>
                <div class="profile-value">${animal.idNumber}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Sex</div>
                <div class="profile-value">${animal.sex}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Genes</div>
                <div class="profile-value">${animal.genes}</div>
              </div>
              ${age ? `
              <div class="profile-item">
                <div class="profile-label">Age</div>
                <div class="profile-value">${formatAge(age)}</div>
              </div>
              ` : ''}
              ${animal.birthday ? `
              <div class="profile-item">
                <div class="profile-label">Birthday</div>
                <div class="profile-value">${formatDate(animal.birthday)}</div>
              </div>
              ` : ''}
              ${animal.weight !== undefined && animal.weight !== null ? `
              <div class="profile-item">
                <div class="profile-label">Current Weight</div>
                <div class="profile-value">${animal.weight.toString()}g</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Meal History</h2>
            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">Total Meals:</span>
                <span class="summary-value">${meals.length}</span>
              </div>
              ${lastMeal ? `
              <div class="summary-item">
                <span class="summary-label">Last Meal:</span>
                <span class="summary-value">${formatDate(lastMeal.timestamp)}</span>
              </div>
              ` : ''}
            </div>
            ${sortedMeals.length > 0 ? `
              <ul class="history-list">
                ${sortedMeals.map(meal => `
                  <li class="history-item">
                    <div class="history-date">${formatDate(meal.timestamp)}</div>
                    <div class="history-details">${meal.details}</div>
                  </li>
                `).join('')}
              </ul>
            ` : '<div class="no-data">No meal records</div>'}
          </div>
          
          <div class="section">
            <h2 class="section-title">Weight History</h2>
            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">Total Weight Entries:</span>
                <span class="summary-value">${weights.length}</span>
              </div>
              ${lastWeight ? `
              <div class="summary-item">
                <span class="summary-label">Last Weight:</span>
                <span class="summary-value">${lastWeight.weight.toString()}g on ${formatDate(lastWeight.timestamp)}</span>
              </div>
              ` : ''}
            </div>
            ${sortedWeights.length > 0 ? `
              <ul class="history-list">
                ${sortedWeights.map(weight => `
                  <li class="history-item">
                    <div class="history-date">${formatDate(weight.timestamp)}</div>
                    <div class="history-details">${weight.weight.toString()}g</div>
                  </li>
                `).join('')}
              </ul>
            ` : '<div class="no-data">No weight records</div>'}
          </div>
          
          <div class="section">
            <h2 class="section-title">Pairing History</h2>
            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">Total Pairings:</span>
                <span class="summary-value">${pairings.length}</span>
              </div>
              ${lastPairing ? `
              <div class="summary-item">
                <span class="summary-label">Last Pairing:</span>
                <span class="summary-value">${formatDate(lastPairing.timestamp)}</span>
              </div>
              ` : ''}
            </div>
            ${sortedPairings.length > 0 ? `
              <ul class="history-list">
                ${sortedPairings.map(pairing => `
                  <li class="history-item">
                    <div class="history-date">${formatDate(pairing.timestamp)}</div>
                    ${pairing.notes ? `<div class="history-details">${pairing.notes}</div>` : ''}
                  </li>
                `).join('')}
              </ul>
            ` : '<div class="no-data">No pairing records</div>'}
          </div>
          
          <div class="section">
            <h2 class="section-title">Clutch History</h2>
            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">Total Clutches:</span>
                <span class="summary-value">${clutches.length}</span>
              </div>
            </div>
            ${sortedClutches.length > 0 ? `
              <ul class="history-list">
                ${sortedClutches.map(clutch => `
                  <li class="history-item">
                    <div class="history-date">${formatDate(clutch.timestamp)}</div>
                    ${clutch.notes ? `<div class="history-details">${clutch.notes}</div>` : ''}
                  </li>
                `).join('')}
              </ul>
            ` : '<div class="no-data">No clutch records</div>'}
          </div>
          
          <div class="section">
            <h2 class="section-title">Maintenance History</h2>
            <div class="summary-box">
              ${lastShed ? `
              <div class="summary-item">
                <span class="summary-label">Last Shed:</span>
                <span class="summary-value">${formatDate(lastShed.timestamp)}</span>
              </div>
              ` : ''}
              ${lastTubChange ? `
              <div class="summary-item">
                <span class="summary-label">Last Tub Change:</span>
                <span class="summary-value">${formatDate(lastTubChange.timestamp)}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Animal Activity Log - Complete Profile Report</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindowRef.current = printWindow;
      printWindow.document.write(printContent);
      printWindow.document.close();

      const checkWindowClosed = setInterval(() => {
        if (printWindow.closed) {
          clearInterval(checkWindowClosed);
          onPrintComplete();
        }
      }, 500);
    } else {
      console.error('Failed to open print window');
      onPrintComplete();
    }

    return () => {
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close();
      }
    };
  }, [animal, meals, weights, pairings, clutches, sheds, tubChanges, onPrintComplete]);

  return null;
}
