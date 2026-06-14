import { Printer } from 'lucide-react';
import { FOOD_FOREST_LAYERS, Shape, PlantingTask, CareItem } from '../../types';
import './DesignReport.css';

const ORDER_GROUPS: { label: string; min: number; max: number; color: string }[] = [
  { label: 'Plant First',  min: 0, max: 2.9, color: '#059669' },
  { label: 'Plant Second', min: 3, max: 3.9, color: '#2563eb' },
  { label: 'Plant Third',  min: 4, max: 4.9, color: '#7c3aed' },
  { label: 'Plant Last',   min: 5, max: 99,  color: '#d97706' },
];

function getOrderGroup(order: number) {
  return ORDER_GROUPS.find(g => order >= g.min && order <= g.max) ?? ORDER_GROUPS[3];
}

interface DesignReportProps {
  projectName: string;
  address: string;
  shapes: Shape[];
  tasks: PlantingTask[];
  careItems: CareItem[];
}

export function DesignReport({ projectName, address, shapes, tasks, careItems }: DesignReportProps) {
  // Get only "to plant" tasks (planned status)
  const toPlantTasks = tasks.filter(t => {
    const shape = shapes.find(s => s.id === t.shapeId);
    const status = shape?.status ?? 'planned';
    return !status || status === 'planned';
  });

  // Group plants by establishment order
  const plantsByOrder = ORDER_GROUPS.map(group => ({
    ...group,
    tasks: toPlantTasks.filter(t => t.establishmentOrder >= group.min && t.establishmentOrder <= group.max),
  })).filter(g => g.tasks.length > 0);

  // Get unique plants with counts and metadata
  const plantMetadata = new Map<string, {
    name: string;
    scientific: string;
    layerId: string;
    count: number;
    spacings: number[];
    guild: string;
    window: string;
    difficulty: number;
    order: number;
  }>();

  toPlantTasks.forEach(task => {
    const shape = shapes.find(s => s.id === task.shapeId);
    if (!shape) return;

    const key = task.plantName;
    if (!plantMetadata.has(key)) {
      plantMetadata.set(key, {
        name: task.plantName,
        scientific: task.plantScientificName || '',
        layerId: task.layerId,
        count: 0,
        spacings: [],
        guild: task.guildRole,
        window: task.bestPlantingWindow,
        difficulty: task.difficulty,
        order: task.establishmentOrder,
      });
    }

    const meta = plantMetadata.get(key)!;
    meta.count += 1;
    if (shape.canopyRadius) meta.spacings.push(shape.canopyRadius);
  });

  // Care items by layer and phase
  const careByLayerPhase = new Map<string, Map<string, CareItem[]>>();
  careItems.forEach(item => {
    if (!careByLayerPhase.has(item.layerId)) {
      careByLayerPhase.set(item.layerId, new Map());
    }
    const phaseMap = careByLayerPhase.get(item.layerId)!;
    if (!phaseMap.has(item.phase)) {
      phaseMap.set(item.phase, []);
    }
    phaseMap.get(item.phase)!.push(item);
  });

  // Summary stats
  const totalPlants = toPlantTasks.length;
  const layersUsed = new Set(toPlantTasks.map(t => t.layerId)).size;
  const totalXp = toPlantTasks.reduce((n, t) => n + t.xpReward, 0);

  return (
    <div className="design-report">
      {/* Header */}
      <div className="report-header">
        <div className="report-title-section">
          <h2 className="report-title">{projectName || 'Food Forest Design'}</h2>
          <p className="report-address">{address}</p>
          <p className="report-date">Generated {new Date().toLocaleDateString()}</p>
        </div>
        <div className="report-actions">
          <button className="report-btn" onClick={() => window.print()} title="Print or save as PDF">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="report-stats">
        <div className="stat-box">
          <div className="stat-label">Total Plants</div>
          <div className="stat-value">{totalPlants}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Layers</div>
          <div className="stat-value">{layersUsed}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total XP</div>
          <div className="stat-value">{totalXp}</div>
        </div>
      </div>

      {/* To Plant Section */}
      <div className="report-section">
        <h3 className="report-section-title">🌱 To Plant (in order)</h3>

        {plantsByOrder.map(group => (
          <div key={group.label} className="report-order-group">
            <div className="report-group-header" style={{ borderColor: group.color }}>
              <span className="report-group-dot" style={{ background: group.color }} />
              {group.label} — {group.tasks.length} plant{group.tasks.length !== 1 ? 's' : ''}
            </div>

            <div className="report-plants-list">
              {group.tasks.map(task => {
                const meta = plantMetadata.get(task.plantName);
                if (!meta) return null;

                const layer = FOOD_FOREST_LAYERS.find(l => l.id === task.layerId);
                const avgSpacing = meta.spacings.length > 0
                  ? (meta.spacings.reduce((a, b) => a + b, 0) / meta.spacings.length).toFixed(1)
                  : 'N/A';

                return (
                  <div key={task.id} className="report-plant-row">
                    <div className="report-plant-info">
                      <div className="report-plant-name">
                        {meta.name}
                        {meta.scientific && <span className="report-plant-sci">{meta.scientific}</span>}
                      </div>
                      <div className="report-plant-details">
                        <span className="report-detail">
                          <span className="report-layer-dot" style={{ background: layer?.color }} />
                          {layer?.name}
                        </span>
                        <span className="report-detail">📏 {meta.count}× @ {avgSpacing} ft canopy</span>
                        <span className="report-detail">🗓 {meta.window}</span>
                      </div>
                      <div className="report-guild">{meta.guild}</div>
                    </div>
                    <div className="report-difficulty">
                      {'★'.repeat(meta.difficulty)}{'☆'.repeat(5 - meta.difficulty)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Year One Care Section */}
      {careItems.length > 0 && (
        <div className="report-section">
          <h3 className="report-section-title">💧 Year One Care Summary</h3>

          {Array.from(careByLayerPhase.entries()).map(([layerId, phaseMap]) => {
            const layer = FOOD_FOREST_LAYERS.find(l => l.id === layerId);
            return (
              <div key={layerId} className="report-layer-care">
                <div className="report-layer-header">
                  <span className="report-layer-dot" style={{ background: layer?.color }} />
                  {layer?.name}
                </div>

                {Array.from(phaseMap.entries()).map(([phase, items]) => (
                  <div key={phase} className="report-phase-group">
                    <div className="report-phase-label">
                      {phase === 'first-30-days' && '💧 First 30 Days'}
                      {phase === 'year-one' && '🌳 Year One'}
                      {phase === 'ongoing' && '♻️ Ongoing'}
                    </div>
                    <ul className="report-care-list">
                      {items.slice(0, 3).map(item => (
                        <li key={item.id}>
                          <strong>{item.title}</strong> — every {item.intervalDays} days ({item.estimatedMinutes} min)
                        </li>
                      ))}
                      {items.length > 3 && <li className="report-care-more">+ {items.length - 3} more tasks</li>}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Shopping List */}
      <div className="report-section">
        <h3 className="report-section-title">🛒 Shopping List</h3>
        <table className="report-shopping-table">
          <thead>
            <tr>
              <th>Plant Name</th>
              <th>Qty</th>
              <th>Layer</th>
              <th>Spacing (ft)</th>
              <th>Plant Window</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(plantMetadata.entries()).map(([name, meta]) => {
              const layer = FOOD_FOREST_LAYERS.find(l => l.id === meta.layerId);
              const avgSpacing = meta.spacings.length > 0
                ? (meta.spacings.reduce((a, b) => a + b, 0) / meta.spacings.length).toFixed(1)
                : 'N/A';

              return (
                <tr key={name}>
                  <td className="report-table-name">
                    <strong>{name}</strong>
                    {meta.scientific && <div className="report-table-sci">{meta.scientific}</div>}
                  </td>
                  <td className="report-table-qty">{meta.count}</td>
                  <td className="report-table-layer">
                    <span className="report-layer-dot" style={{ background: layer?.color }} />
                    {layer?.name}
                  </td>
                  <td className="report-table-spacing">{avgSpacing}</td>
                  <td className="report-table-window">{meta.window}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="report-footer">
        <p>💡 Tip: Take this report to the nursery to get specific cultivars and check availability.</p>
        <p>Remember: Plant in the recommended order to establish a healthy guild structure.</p>
      </div>
    </div>
  );
}
