'use client'
import WorldMap from 'react-svg-worldmap'

const mapProps = {
  data: [],
  size: 300,
  backgroundColor: 'transparent',
  strokeColor: '#fff',
  color: 'white',
  styleFunction: (context: any) => ({
    fill: 'bg-primary',
    stroke: context.color,
    strokeWidth: 0.5,
  }),
  tooltipTextFunction: () => '',
}

const WorldMapDecoration = () => <WorldMap {...mapProps} />

export default WorldMapDecoration
