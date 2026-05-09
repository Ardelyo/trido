import React from 'react';
import { FloatingToolContainer } from './FloatingToolContainer';
import { TimerTool } from './TimerTool';
import { CalculatorTool } from './CalculatorTool';
import { NotesTool } from './NotesTool';
import { QuizTool } from './QuizTool';
import { UnitConverterTool } from './UnitConverterTool';
import { PeriodicTableTool } from './PeriodicTableTool';
import { AttendanceTool } from './AttendanceTool';
import { TodoListTool } from './TodoListTool';
import { BoardSettingsTool } from './BoardSettingsTool';
import { useStore } from '../store';
import { Clock, PencilRuler, FileText, HelpCircle, Activity, Network, Users, CheckSquare, Settings } from 'lucide-react';

export const ToolOverlay: React.FC = () => {
  const {
    isTimerOpen, toggleTimer,
    isCalculatorOpen, toggleCalculator,
    isNotesOpen, toggleNotes,
    isQuizOpen, toggleQuiz,
    isUnitConverterOpen, toggleUnitConverter,
    isPeriodicTableOpen, togglePeriodicTable,
    isAttendanceOpen, toggleAttendance,
    isTodoListOpen, toggleTodoList,
    isBoardSettingsOpen, toggleBoardSettings
  } = useStore();

  return (
    <React.Fragment>
      <FloatingToolContainer 
        title="Timer & Waktu" 
        isOpen={isTimerOpen} 
        onClose={toggleTimer} 
        icon={Clock}
        defaultPosition={{ x: 100, y: 100 }}
        height={400}
      >
        <TimerTool config={{ mode: 'TIMER', seconds: 300 }} />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Kalkulator" 
        isOpen={isCalculatorOpen} 
        onClose={toggleCalculator} 
        icon={PencilRuler}
        defaultPosition={{ x: 450, y: 120 }}
        width={340}
        height={540}
      >
        <CalculatorTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Catatan" 
        isOpen={isNotesOpen} 
        onClose={toggleNotes} 
        icon={FileText}
        defaultPosition={{ x: 120, y: 350 }}
        width={400}
        height={450}
      >
        <NotesTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Kuis Hub" 
        isOpen={isQuizOpen} 
        onClose={toggleQuiz} 
        icon={HelpCircle}
        defaultPosition={{ x: 500, y: 150 }}
        width={380}
        height={560}
      >
        <QuizTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Konversi Satuan" 
        isOpen={isUnitConverterOpen} 
        onClose={toggleUnitConverter} 
        icon={Activity}
        defaultPosition={{ x: 150, y: 150 }}
        width={320}
        height={380}
      >
        <UnitConverterTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Tabel Periodik" 
        isOpen={isPeriodicTableOpen} 
        onClose={togglePeriodicTable} 
        icon={Network}
        defaultPosition={{ x: 200, y: 200 }}
        width={420}
        height={320}
      >
        <PeriodicTableTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Pencatat Kehadiran" 
        isOpen={isAttendanceOpen} 
        onClose={toggleAttendance} 
        icon={Users}
        defaultPosition={{ x: 250, y: 100 }}
        width={360}
        height={460}
      >
        <AttendanceTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Daftar Tugas" 
        isOpen={isTodoListOpen} 
        onClose={toggleTodoList} 
        icon={CheckSquare}
        defaultPosition={{ x: 300, y: 200 }}
        width={340}
        height={420}
      >
        <TodoListTool />
      </FloatingToolContainer>

      <FloatingToolContainer 
        title="Pengaturan Papan" 
        isOpen={isBoardSettingsOpen} 
        onClose={toggleBoardSettings} 
        icon={Settings}
        defaultPosition={{ x: 350, y: 50 }}
        width={340}
        height={400}
      >
        <BoardSettingsTool />
      </FloatingToolContainer>

    </React.Fragment>
  );
};
